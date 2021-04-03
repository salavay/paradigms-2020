let anaryOperation = (operation) => (...args) => (...variables) => operation(...(args.map(ind => ind(...variables))));

let operationWithArity = (operation, arity) => {
    operation.arity = arity;
    return operation;
}


const cnst = operationWithArity(str => {
    switch (str) {
        case 'pi':
            return () => Math.PI;
        case 'e':
            return () => Math.E;
        default:
            return () => parseInt(str, 10);
    }
}, 1);
const pi = cnst("pi");
const e = cnst("e");

let variable = operationWithArity(name => (...vars) => {
    switch (name) {
        case 'x':
            return vars[0];
        case 'y':
            return vars[1];
        case 'z':
            return vars[2];
    }
}, 1);

let sin = operationWithArity(anaryOperation(Math.sin),1);
let cos = operationWithArity(anaryOperation(Math.cos),1);
let cube = operationWithArity(anaryOperation(x => x*x*x),1);
let cuberoot = operationWithArity(anaryOperation(function(x){
        let a = Math.pow(Math.abs(x), 1/3);
        if (x < 0) {
                a *= -1;
        }
        return a;
}),1);
let negate = operationWithArity(anaryOperation(x => -x) ,1);

let add = operationWithArity(anaryOperation((x, y) => x + y),2);
let subtract = operationWithArity(anaryOperation((x, y) => x - y),2);
let multiply = operationWithArity(anaryOperation((x, y) => x * y),2);
let divide = operationWithArity(anaryOperation((x, y) => x / y),2);

let med3 = operationWithArity(anaryOperation(function(...args) {
    let arr = args;
    arr.sort((a,b) => a - b);
    return arr[1];
}),3);

let avg5 = operationWithArity(anaryOperation(function(...args) {
    let arr = args;
    let res = arr.reduce(function(sum, current) {
        return sum + current;
    });
    return res/5;
}),5);




let mapOfOperators = function(str, stack) {
    switch (str) {
        case "sin": return sin;
        case "cos": return cos;
        case "cube": return cube;
        case "cuberoot": return cuberoot;
        case "negate": return negate;
        case "+" : return add;
        case "-" : return subtract;
        case "*" : return multiply;
        case "/" : return divide;
        case "med3": return med3;
        case "avg5" : return avg5;
        default: 
            stack.push(str);
             switch (str) {
                case "x":
                case "y":
                case "z":
                    return variable;
                default:
                    return cnst;
            }
    }
};

let parse = function(source) {
        source = source.trim();
        let arrFromTheSource = source.split(/[' ']+/);
        let result = arrFromTheSource.reduce(function(stack, cur){
            let operator = mapOfOperators(cur, stack);    
            let args = stack.slice(stack.length - operator.arity);
            stack.length -= operator.arity;
            stack.push(operator(...args));
            return stack;
        }, [] );
        return result.pop();
}
