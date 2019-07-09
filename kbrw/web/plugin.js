module.exports = function({ types: t }) {
  return {
    visitor: {
   		JSXElement(path) {
        	const name = path.node.name;
        	// reverse the name: JavaScript -> tpircSavaJ
        	if (path.node.openingElement.name.name == "Declaration") {
        		var decl = parseChildren(t, path.node.openingElement.attributes)
        		var val;
        		if (typeof decl.value == 'number')
        			val = t.numericLiteral(decl.value);
        		else
        			val = t.stringLiteral(decl.value);
        		path.replaceWith(
        			t.variableDeclaration("var", 
        				[t.variableDeclarator(
        					t.identifier(decl.name), 
        					val)])
    			);

        	}
      	},
    }
  };
}

function parseChildren(t, attributes) {
	var result = {};
	attributes.forEach(function(item, index) {
		if (item.name.name == "value") {
			if (t.isLiteral(item.value.expression))
				result["value"] = item.value.expression.value;
			else
				result["value"] = item.value.value;
		}
		if (item.name.name == "var")
			result["name"] = item.value.value;
	});
	return result;
}