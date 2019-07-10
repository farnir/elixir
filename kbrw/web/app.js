require('!!file-loader?name=[name].[ext]!./index.html')
require('./webapp/stylesheet.css');
var ReactDOM = require('react-dom')
var React = require("react")
var createReactClass = require('create-react-class')

var orders = [
  {remoteid: "000000189", custom: {customer: {full_name: "TOTO & CIE"}, billing_address: "Some where in the world"}, items: 2}, 
  {remoteid: "000000190", custom: {customer: {full_name: "Looney Toons"}, billing_address: "The Warner Bros Company"}, items: 3}, 
  {remoteid: "000000191", custom: {customer: {full_name: "Asterix & Obelix"}, billing_address: "Armorique"}, items: 29}, 
  {remoteid: "000000192", custom: {customer: {full_name: "Lucky Luke"}, billing_address: "A Cowboy doesn't have an address. Sorry"}, items: 0}, 
]

var Page = createReactClass( {
	render(){
		return (
			<div>
				<JSXZ in="orders" sel=".div-block"></JSXZ>
				<JSXZ in="orders" sel=".form-block"></JSXZ>
				<JSXZ in="orders" sel=".tab-header"></JSXZ>
				{
					orders.map( order => (<JSXZ in="orders" sel=".tab-line">
  					<Z sel=".col-1">{order.remoteid}</Z>
  					<Z sel=".col-2">{order.custom.customer.full_name}</Z>
  					<Z sel=".col-3">{order.custom.billing_address}</Z>
  					<Z sel=".col-4">{order.items}</Z>
  					</JSXZ>))
				}
				<JSXZ in="orders" sel=".index-div"></JSXZ>
			</div>
		)
	}
})

ReactDOM.render(<Page />, document.getElementById('root'));