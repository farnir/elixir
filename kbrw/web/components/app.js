require('../webflow/stylesheet.css');
require('../webflow/modal.css');

var XMLHttpRequest = require("xhr2")
var localhost = require('reaxt/config').localhost
var React = require("react")
var createReactClass = require('create-react-class')
var Qs = require('qs')
var Cookie = require('cookie')
var When = require('when')

var routes = {
  "orders": {
    path: (params) => `/orders`,
    match: (path, qs) => {
      if (typeof qs.page == 'undefined')
        qs.page = 1;
      return (path == "/orders") && {handlerPath: [Layout, Header, Orders]}
    }
  }, 
  "order": {
    path: (params) => `/order/${params.order_id}`,
    match: (path, qs) => {
      var r = new RegExp("/order/([^/]*)$").exec(path)
      return r && {handlerPath: [Layout, Header, Order],  order_id: r[1]}
    }
  }
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
      url: "/api/orders?*=*" + (query == '' ? '' : '&' + query),
      prop: "orders",
      nocache: false,
    }
  },
  order: (props)=>{
    return {
      url: "/api/orders?id=" + props.order_id,
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
    return {modal: null, loader: null};
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
  loader(promise){
    this.setState({loader: {
      ...promise}});
    return promise.callback.then(() => this.setState({loader: null}));
  },
render(){
  var modal_component = {
    'delete': (props) => <DeleteModal {...props}/>
  }[this.state.modal && this.state.modal.type];
  modal_component = modal_component && modal_component(this.state.modal)

  var loader_component = {
    'load': (props) => <Loader {...props}/>
  }[this.state.loader && this.state.loader.type];
  loader_component = loader_component && loader_component(this.state.loader)

  var props = {
    ...this.props, modal: this.modal, loader: this.loader
}
    return <JSXZ in="orders" sel=".layout">
        <Z sel=".layout-modal-wrapper" className={cn(classNameZ, {'hidden': !modal_component})}>
          {modal_component}
        </Z>
        <Z sel=".layout-loader-wrapper" className={cn(classNameZ, {'hidden': !loader_component})}>
          {loader_component}
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

var Loader = React.createClass({
  render(){
    return <JSXZ in="loader" sel=".loader-wrapper">
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
  getInitialState: function() {
    return {value: ""};
  },
  statics: {
    remoteProps: [remoteProps.orders]
  },
  handleSubmit(event) {
    event.preventDefault();
    var result = {}
    var attr = this.state.value.split('&');
    attr.forEach(element => {
      var keys = element.split('=');
      result[keys[0]] = keys[1];
    });
    Link.GoTo("orders", {}, result );
  },
  handleChange(event) {
    this.setState({value: event.target.value});
  },
  render(){
    return <JSXZ in="orders" sel=".container">
            <Z sel=".form" onSubmit={this.handleSubmit}><ChildrenZ/></Z>
            <Z sel=".text-field" value={this.state.value} onChange={this.handleChange}><ChildrenZ/></Z>
            <Z sel=".tab-body">
          {
				    this.props.orders.value.docs.map( (order, i) => <JSXZ in="orders" sel=".tab-line" key={i}>
					  <Z sel=".col-1">{order.id}</Z>
					  <Z sel=".col-2">{order["custom.customer.full_name"]}</Z>
            <Z sel=".col-3">{order["custom.billing_address"]}</Z>
            <Z sel=".col-4">{order.items}</Z>
            <Z sel=".text-block-5">Status: {order["payment.status.state"]}</Z>
            <Z sel=".text-block-6">Payment method: {order["payment.payment_method"]}</Z>
            <Z sel=".button-details" onClick={() => Link.GoTo("order", { order_id: order.id }, {...this.props.qs})}><ChildrenZ/></Z>
              <Z sel=".button-pay" onClick={() => {
                var promise = HTTP.post("/api/pay", { key: order._yz_rk });
                this.props.loader({
                  type: 'load',
                  callback: new Promise(resolve => {
                    setTimeout(() => {
                      promise.then(() => {
                        this.props.orders.nocache = true;
                        Link.GoTo("orders", {}, this.props.qs);
                        resolve();
                      });
                    }, 1500);
                  })
                });
              }} className={cn(classNameZ, {'hidden': (order["payment.status.state"] != "init")})}><ChildrenZ /></Z>
            <Z sel=".button-trash" onClick={() => this.props.modal({
              type: 'delete',
              title: 'Order deletion',
              message: `Are you sure you want to delete this ?`,
              callback: (value)=>{
                if (value == "submit") {
                    var promise = HTTP.delete("/api/orders?key=" + order._yz_rk);
                    this.props.loader({
                      type: 'load',
                      callback: new Promise(resolve => {
                          setTimeout(() => {
                            promise.then(() => {
                              this.props.orders.nocache = true;
                              Link.GoTo("orders", {}, this.props.qs);
                              resolve();
                            });
                          }, 1000);
                      })
                    });
                }
              }
            })}><ChildrenZ /></Z>
            <Z sel=".button-refresh" onClick={() => this.props.loader({
              type: 'load',
              callback: new Promise(resolve => {
                this.props.orders.nocache = true;
                Link.GoTo("orders", {}, this.props.qs);
                setTimeout(resolve, 500);
              })
            })}><ChildrenZ /></Z>                
				  </JSXZ>)
			    }
          </Z>
          <Z sel=".page-first" onClick={() => Link.GoTo("orders", {}, {...this.props.qs, page: 1})} className={cn(classNameZ, {'hidden': (this.props.qs.page <= 1)})}><ChildrenZ/></Z>
          <Z sel=".page-before" onClick={() => Link.GoTo("orders", {}, {...this.props.qs, page: parseInt(this.props.qs.page) - 1})} className={cn(classNameZ, {'hidden': (this.props.qs.page <= 1)})}><ChildrenZ/></Z>
          <Z sel=".page-div-2">
          {
            calcRange(parseInt(this.props.qs.page), Math.ceil(this.props.orders.value.numFound / 30)).map( (i) => 
            <JSXZ in="orders" sel=".page-div-index" key={i}>
              <Z sel=".pagen" onClick={() => Link.GoTo("orders", {}, {...this.props.qs, page: i})} className={cn(classNameZ, {'highlight': (this.props.qs.page == i)})}>{i}</Z>
            </JSXZ>)
          }
          </Z>
          <Z sel=".page-next" onClick={() => Link.GoTo("orders", {}, {...this.props.qs, page: parseInt(this.props.qs.page) + 1})} className={cn(classNameZ, {'hidden': this.props.qs.page >= Math.ceil(this.props.orders.value.numFound / 30)})}><ChildrenZ/></Z>
          <Z sel=".page-last" onClick={() => Link.GoTo("orders", {}, {...this.props.qs, page: Math.ceil(this.props.orders.value.numFound / 30)})} className={cn(classNameZ, {'hidden': this.props.qs.page >= Math.ceil(this.props.orders.value.numFound / 30)})}><ChildrenZ/></Z>
			</JSXZ>
  }
})

function calcRange(currPage, max) {
  if (max < 3)
    return range(1, max);
  if (currPage <= 1)
    return range(1, 3);
  if (currPage >= max)
    return range(max - 2, max);
  return range(currPage - 1, currPage + 1)
}

function range (start, end) { return [...Array(1+end-start).keys()].map(v => start+v) }

var Order = createReactClass({
  statics: {
    remoteProps: [remoteProps.order]
  },
  render(){
    return <JSXZ in="details" sel=".container">
      <Z sel=".client-name">{this.props.order.value.docs[0]["custom.customer.full_name"]}</Z>
      <Z sel=".client-address">{this.props.order.value.docs[0]["custom.billing_address"]}</Z>
      <Z sel=".client-number">{this.props.order.value.docs[0].id}</Z>
      <Z sel=".button-2" onClick={() => Link.GoTo("orders", {}, this.props.qs)}><ChildrenZ /></Z>
    </JSXZ>
  }
})

var Link = createReactClass({
  statics: {
    renderFunc: null, //render function to use (differently set depending if we are server sided or client sided)
    GoTo(route, params, query){// function used to change the path of our browser
      var path = routes[route].path(params)
      var qs = Qs.stringify(query)
      var url = path + (qs == '' ? '' : '?' + qs)
      history.pushState({},"",url)
      Link.onPathChange()
    },
    onPathChange(){ //Updated onPathChange
      var path = location.pathname
      var qs = Qs.parse(location.search.slice(1))
      var cookies = Cookie.parse(document.cookie)
      inferPropsChange(path, qs, cookies).then( //inferPropsChange download the new props if the url query changed as done previously
        ()=>{
          console.log(browserState);
          Link.renderFunc(<Child {...browserState}/>) //if we are on server side we render 
        },({http_code})=>{
          Link.renderFunc(<ErrorPage message={"Not Found"} code={http_code}/>, http_code) //idem
        }
      )
    },
    LinkTo: (route,params,query)=> {
      var qs = Qs.stringify(query)
      return routes[route].path(params) +((qs=='') ? '' : ('?'+qs))
    }
  },
  onClick(ev) {
    ev.preventDefault();
    Link.GoTo(this.props.to,this.props.params,this.props.query);
  },
  render (){//render a <Link> this way transform link into href path which allows on browser without javascript to work perfectly on the website
    return (
      <a href={Link.LinkTo(this.props.to,this.props.params,this.props.query)} onClick={this.onClick}>
        {this.props.children}
      </a>
    )
  }
})

var HTTP = new (function(){
  this.get = (url)=>this.req('GET',url)
  this.delete = (url)=>this.req('DELETE',url)
  this.post = (url,data)=>this.req('POST',url,data)
  this.put = (url,data)=>this.req('PUT',url,data)

  this.req = (method,url,data)=>{
    return new Promise((resolve, reject) => {
    var req = new XMLHttpRequest()
    url = (typeof window !== 'undefined') ? url : localhost+url
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
}})()

var browserState = {}

function inferPropsChange(path,query,cookies){ // the second part of the onPathChange function have been moved here
  browserState = {
    ...browserState,
    path: path, qs: query,
    Link: Link,
    Child: Child
  }

  var route, routeProps
  for(var key in routes) {
    routeProps = routes[key].match(path, query)
    if(routeProps){
      route = key
      break
    }
  }

  if(!route){
    return new Promise( (res,reject) => reject({http_code: 404}))
  }
  browserState = {
    ...browserState,
    ...routeProps,
    route: route
  }

  return addRemoteProps(browserState).then(
    (props)=>{
      browserState = props
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

module.exports = {
  reaxt_server_render(params, render){
    inferPropsChange(params.path, params.query, params.cookies)
      .then(()=>{
        render(<Child {...browserState}/>)
      },(err)=>{
        render(<ErrorPage message={"Not Found :" + err.url } code={err.http_code}/>, err.http_code)
      })
  },
  reaxt_client_render(initialProps, render){
    browserState = initialProps
    Link.renderFunc = render
    window.addEventListener("popstate", ()=>{ Link.onPathChange() })
    Link.onPathChange()
  }
}