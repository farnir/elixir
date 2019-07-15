require('!!file-loader?name=[name].[ext]!./index.html')
require('./webflow/stylesheet.css');
require('./webflow/modal.css');

var XMLHttpRequest = require("xhr2")
var ReactDOM = require('react-dom')
var React = require("react")
var createReactClass = require('create-react-class')
var Qs = require('qs')
var Cookie = require('cookie')
var When = require('when')

var routes = {
  "orders": {
    path: "/orders",
    match: (path, qs) => {
      return (path == "/orders") && {handlerPath: [Layout, Header, Orders]}
    }
  }, 
  "order": {
    path: "/order",
    match: (path, qs) => {
      var r = new RegExp("/order/([^/]*)$").exec(path)
      return r && {handlerPath: [Layout, Header, Order],  order_id: r[1]}
    }
  }
}

var GoTo = (route, params, query) => {
  var qs = Qs.stringify(query)
  var url = routes[route].path + params + ((qs=='') ? '' : ('?'+qs))
  history.pushState({}, "", url)
  onPathChange()
}

var cn = function(){
  var args = arguments, classes = {}
  for (var i in args) {
    var arg = args[i]
    if(!arg) continue
    if ('string' === typeof arg || 'number' === typeof arg) {
      arg.split(" ").filter((c)=> c!="").map((c)=>{
        classes[c] = true
      })
    } else if ('object' === typeof arg) {
      for (var key in arg) classes[key] = arg[key]
    }
  }
  return Object.keys(classes).map((k)=> classes[k] && k || '').join(' ')
}

var remoteProps = {
  user: (props)=>{
    return {
      url: "/api/me",
      prop: "user",
      nocache: false,
    }
  },
  orders: (props)=>{
    if(!props.user)
      return
    var qs = {...props.qs}
    var query = Qs.stringify(qs)
    return {
      url: "/api/orders" + (query == '' ? '' : '?' + query),
      prop: "orders",
      nocache: false,
    }
  },
  order: (props)=>{
    return {
      url: "/api/order/" + props.order_id,
      prop: "order",
      nocache: false
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
  getInitialState: function() {
    return {modal: null};
  },
  modal(spec){
    this.setState({modal: {
      ...spec, callback: (res)=>{
        this.setState({modal: null},()=>{
          if(spec.callback) spec.callback(res)
        })
      }
    }})
  },
render(){
  var modal_component = {
    'delete': (props) => <DeleteModal {...props}/>
  }[this.state.modal && this.state.modal.type];
  modal_component = modal_component && modal_component(this.state.modal)

  var props = {
    ...this.props, modal: this.modal
}
    return <JSXZ in="orders" sel=".layout">
        <Z sel=".layout-modal-wrapper" className={cn(classNameZ, {'hidden': !modal_component})}>
          {modal_component}
        </Z>
        <Z sel=".layout-container"><this.props.Child {...props}/></Z>
    </JSXZ>
  }
})

var DeleteModal = React.createClass({
  render(){
    return <JSXZ in="modal" sel=".modal-wrapper">
      <Z sel=".form-head">{this.props.title}</Z>
      <Z sel=".field-label">{this.props.message}</Z>
      <Z sel=".submit-modal" onClick={() => this.props.callback("submit")}></Z>
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
				    this.props.orders.value.map( (order, i) => <JSXZ in="orders" sel=".tab-line" key={i}>
					  <Z sel=".col-1">{order.id}</Z>
					  <Z sel=".col-2">{order.custom.customer.full_name}</Z>
            <Z sel=".col-3">{order.custom.billing_address}</Z>
            <Z sel=".col-4">{order.items}</Z>
            <Z sel=".col-5">
              <button onClick={() => GoTo("orders", "")} className="button-pay"></button>
            </Z>
            <Z sel=".link">
              <button onClick={() => GoTo("order", "/" + order.id)} className="button-pay"></button>
              <button onClick={() => this.props.modal({
                type: 'delete',
                title: 'Order deletion',
                message: `Are you sure you want to delete this ?`,
                callback: (value)=>{
                  if (value == "submit") {
                    this.props.orders.nocache = true;
                    HTTP.get("/api/delete?id=" + order.id)
                    .then(() => {
                        GoTo("orders", "");}
                    );
                  }
                }
              })} className="button-pay"></button>              
            </Z>
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
      <Z sel=".client-name">{this.props.order.value.custom.customer.full_name}</Z>
      <Z sel=".client-address">{this.props.order.value.custom.billing_address}</Z>
      <Z sel=".client-number">{this.props.order.value.id}</Z>
      <Z sel=".link">
        <button onClick={() => GoTo("orders", "")} className="button-2">Go back</button>
      </Z>
    </JSXZ>
  }
})

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
    .filter((specs)=> !props[specs.prop] || props[specs.prop].url != specs.url || props[specs.prop].nocache == true) // get rid of remoteProps already resolved with the url
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
        acc[spec.prop] = {url: spec.url, value: spec.value, nocache: false}
        return acc
      }, props).then((newProps)=>{
        addRemoteProps(newProps).then(resolve, reject)
      }, reject)
    })
  }

window.addEventListener("popstate", ()=>{ onPathChange() })
onPathChange()