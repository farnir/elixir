require('!!file-loader?name=[name].[ext]!./index.html')
require('./webflow/stylesheet.css');

var ReactDOM = require('react-dom')
var React = require("react")
var createReactClass = require('create-react-class')
var Qs = require('qs')
var Cookie = require('cookie')
var When = require('when')

var routes = {
  "orders": {
    match: (path, qs) => {
      return (path == "/orders") && {handlerPath: [Layout, Header, Orders]}
    }
  }, 
  "order": {
    match: (path, qs) => {
      var r = new RegExp("/order/([^/]*)$").exec(path)
      return r && {handlerPath: [Layout, Header, Order],  order_id: r[1]}
    }
  }
}

var remoteProps = {
  user: (props)=>{
    return {
      url: "/api/me",
      prop: "user"
    }
  },
  orders: (props)=>{
    if(!props.user)
      return
    var qs = {...props.qs}
    var query = Qs.stringify(qs)
    return {
      url: "/api/orders" + (query == '' ? '' : '?' + query),
      prop: "orders"
    }
  },
  order: (props)=>{
    return {
      url: "/api/order/" + props.order_id,
      prop: "order"
    }
  }
}

var Child = createReactClass({
  render(){
    var [ChildHandler,...rest] = this.props.handlerPath
    return <ChildHandler {...this.props} handlerPath={rest} />
  }
})

var ErrorPage = createReactClass({
	render() {
		return <h1>{this.props.message}</h1>
	}
})

var Layout = createReactClass({
render(){
  return <JSXZ in="orders" sel=".layout">
      <Z sel=".layout-container">
        <this.props.Child {...this.props}/>
      </Z>
    </JSXZ>
  }
})

var Header = createReactClass({
  statics: {
    remoteProps: [remoteProps.user]
  },
render(){
  return <JSXZ in="orders" sel=".header">
  	<Z sel=".header-container">
  	<this.props.Child {...this.props}/>
  	</Z>
  </JSXZ>
  }
})

var Orders = createReactClass({
  statics: {
    remoteProps: [remoteProps.orders]
  },
  render(){
    return <JSXZ in="orders" sel=".container">
            <Z sel=".tab-body">
          {
				    this.props.orders.value.map( order => <JSXZ in="orders" sel=".tab-line">
					  <Z sel=".col-1">{order.id}</Z>
					  <Z sel=".col-2">{order.custom.customer.full_name}</Z>
            <Z sel=".col-3">{order.custom.billing_address}</Z>
            <Z sel=".col-4">{order.items}</Z>
            <Z sel=".link"><a href={"/order/" + order.id} class="button-pay w-button"></a></Z>
				  </JSXZ>)
			    }
            </Z>
			</JSXZ>
  }
})

var Order = createReactClass({
  statics: {
    remoteProps: [remoteProps.order]
  },
  render(){
    return <JSXZ in="details" sel=".container">
    </JSXZ>
  }
})

var XMLHttpRequest = require("xhr2")
var HTTP = new (function(){
  this.get = (url)=>this.req('GET',url)
  this.delete = (url)=>this.req('DELETE',url)
  this.post = (url,data)=>this.req('POST',url,data)
  this.put = (url,data)=>this.req('PUT',url,data)

  this.req = (method,url,data)=> new Promise((resolve, reject) => {
    var req = new XMLHttpRequest()
    req.open(method, url)
    req.responseType = "text"
    req.setRequestHeader("content-type","application/json")
    req.onload = ()=>{
      if(req.status >= 200 && req.status < 300){
      resolve(req.responseText && JSON.parse(req.responseText))
      }else{
      reject({http_code: req.status})
      }
    }
  req.onerror = (err)=>{
    reject({http_code: req.status})
  }
  req.send(data && JSON.stringify(data))
  })
})()

var browserState = {Child: Child}

function onPathChange() {
	var path = location.pathname;
	var qs = Qs.parse(location.search.slice(1));
	var cookies = Cookie.parse(document.cookie);
  	browserState = {
    	...browserState, 
    	path: path, 
    	qs: qs, 
    	cookie: cookies
  	}

  var route, routeProps

  for(var key in routes) {
    routeProps = routes[key].match(path, qs)
    if(routeProps){
        route = key
          break;
    }
  }

  browserState = {
    ...browserState,
    ...routeProps,
    route: route
  }

  addRemoteProps(browserState).then(
    (props) => {
      browserState = props
      //Log our new browserState
      console.log(browserState)
      //Render our components using our remote data
      ReactDOM.render(<Child {...browserState}/>, document.getElementById('root'))
    }, (res) => {
      ReactDOM.render(<ErrorPage message={"Shit happened"} code={res.http_code}/>, document.getElementById('root'))
    })
}

function addRemoteProps(props){
  return new Promise((resolve, reject)=>{
    var remoteProps = Array.prototype.concat.apply([],
      props.handlerPath
        .map((c)=> c.remoteProps) // -> [[remoteProps.user], [remoteProps.orders], null]
        .filter((p)=> p) // -> [[remoteProps.user], [remoteProps.orders]]
    )
    var remoteProps = remoteProps
    .map((spec_fun)=> spec_fun(props) ) // -> 1st call [{url: '/api/me', prop: 'user'}, undefined]
                              // -> 2nd call [{url: '/api/me', prop: 'user'}, {url: '/api/orders?user_id=123', prop: 'orders'}]
    .filter((specs)=> specs) // get rid of undefined from remoteProps that don't match their dependencies
    .filter((specs)=> !props[specs.prop] ||  props[specs.prop].url != specs.url) // get rid of remoteProps already resolved with the url
  if(remoteProps.length == 0)
    return resolve(props)
      // check out https://github.com/cujojs/when/blob/master/docs/api.md#whenmap and https://github.com/cujojs/when/blob/master/docs/api.md#whenreduce
      var promise = When.map( // Returns a Promise that either on a list of resolved remoteProps, or on the rejected value by the first fetch who failed 
        remoteProps.map((spec)=>{ // Returns a list of Promises that resolve on list of resolved remoteProps ([{url: '/api/me', value: {name: 'Guillaume'}, prop: 'user'}])
          return HTTP.get(spec.url)
            .then((result)=>{spec.value = result; return spec}) // we want to keep the url in the value resolved by the promise here. spec = {url: '/api/me', value: {name: 'Guillaume'}, prop: 'user'} 
        })
      )
  
      When.reduce(promise, (acc, spec)=>{ // {url: '/api/me', value: {name: 'Guillaume'}, prop: 'user'}
        acc[spec.prop] = {url: spec.url, value: spec.value}
        return acc
      }, props).then((newProps)=>{
        addRemoteProps(newProps).then(resolve, reject)
      }, reject)
    })
  }

window.addEventListener("popstate", ()=>{ onPathChange() })
onPathChange()