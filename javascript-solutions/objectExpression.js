"use strict";
// review

// :NOTE: common mistakes: 2?, 7

const MainProto = function(toString, evaluate, diff, prefix, postfix, arity) {
    let expr = function(...args) {
        this.args = args;
    }
    expr.prototype = Object.create(Object);
    expr.prototype.toString = toString;
    expr.prototype.evaluate = evaluate;
    expr.prototype.diff = diff;
    expr.prototype.prefix = prefix;
    expr.prototype.postfix = postfix;
    expr.prototype.arity = arity;
    return expr
};

// :NOTE: why it's not const
const everyConstToString = function() {
    return this.args[0] + "";
};
const Const = MainProto(everyConstToString,
                        function () { return parseFloat(this.args[0]) },
                            (variable) => ZERO,
                            everyConstToString,
                            everyConstToString,
                            1
);

const ZERO = new Const(0);
const ONE = new Const(1);
const mapVariableName = {
    "x": 0,
    "y": 1,
    "z": 2
}

const everyVariableToString = function() {
    return this.args[0];
};

const Variable = MainProto(
    everyVariableToString,
    function(...vars) { return vars[mapVariableName[this.args[0]]] },
    function(par) { return this.args[0] === par ? ONE : ZERO },
    everyVariableToString,
    everyVariableToString,
    1
                          );

const AnaryOperation = MainProto(
        function() {
            return (this.args.map(x => x.toString() + " ").join("")) + this.naming;
        },

        function(...vars) {
            return this.operation(...this.args.map(x => x.evaluate(...vars)));
        },

        function(variableOfDiff) {
            return this.diffAbstr(variableOfDiff, ...this.args);
        },
        // :NOTE: not clear (2)
        function() {
            return "(" + this.naming + " " + (this.args.map(x => x.prefix()).join(" ")) + ")";
        },
        
        function() {
            return "(" + (this.args.map(x => x.postfix() + "").join(" ")) + " " + this.naming + ")";
        },
        function() {
            return this.operation.length;
        }
    );


const AbstractOperation = function(operation, name, diff) {
    function anaryoperation(...args) {
        AnaryOperation.call(this, ...args); 
    }

    anaryoperation.prototype = Object.create(AnaryOperation.prototype);
    anaryoperation.prototype.constructor = anaryoperation;
    anaryoperation.prototype.operation = operation;
    anaryoperation.prototype.naming = name;
    anaryoperation.prototype.diffAbstr = diff;
    anaryoperation.prototype.arity = operation.length;
    return anaryoperation;
};


const Add = AbstractOperation((x,y) => x + y, "+", 
                           function(variableOfDiff, x, y ) { return new Add(x.diff(variableOfDiff), y.diff(variableOfDiff));});
const Subtract = AbstractOperation((x,y) => x - y, "-", 
                           function(variableOfDiff, x, y ) { return new Subtract(x.diff(variableOfDiff), y.diff(variableOfDiff));});
const Multiply = AbstractOperation((x,y) => x * y, "*",
                           function(variableOfDiff, x, y) { return new Add(new Multiply(x.diff(variableOfDiff), y),
                            new Multiply(x, y.diff(variableOfDiff)));});
const Divide = AbstractOperation((x,y) => x / y, "/",
                           function(variableOfDiff, x,y) { return new Divide(new Subtract(new Multiply(x.diff(variableOfDiff), y),
                            new Multiply(x, y.diff(variableOfDiff))),
                            new Power(y, new Const(2)));});
const Negate = AbstractOperation((x) => -x, "negate",
                           function(variableOfDiff, x) { return new Subtract(new Const(0), x.diff(variableOfDiff));});
const Power = AbstractOperation((x, y) => Math.pow(x,y), "pow",
                           function(variableOfDiff, x, y) {
                            return new Add(new Multiply(new Multiply(y,new Power(x,
                            new Subtract(y, new Const(1)))), x.diff(variableOfDiff)), new Multiply(new Multiply(
                            new Power(x, y), new Log(new Const(Math.E), x)), y.diff(variableOfDiff)));
                            });
const Log = AbstractOperation(function(x, y) {
            return (Math.log(Math.abs(y))/Math.log(Math.abs(x)));
    }, "log",
                           function(variableOfDiff, x, y) {
                            
                            return new Divide(
                            new Subtract(new Multiply(new Multiply(new Divide(new Const(1), y),
                            y.diff(variableOfDiff)), new Log(new Const(Math.E), x)),
                                new Multiply(new Multiply(new Divide(new Const(1), x),
                                x.diff(variableOfDiff)), new Log(new Const(Math.E), y))),
                                new Power(new Log(new Const(Math.E), x), new Const(2)));   
                            });
const Sum = AbstractOperation(
    function(...args) {
        let sum = args.reduce(function(nsum, cur){
            return nsum + cur; 
        }, 0);
        return sum;
    }, 
    "sum",
    function(variableOfDiff, ...args) {
            return new Sum(...args.map(x => x.diff(variableOfDiff)));
        }
);

const Softmax = AbstractOperation(
    function(...args) {
        let sum = args.reduce(function(nsum, cur){
            return nsum + Math.pow(Math.E, cur); 
        }, 0);
        return Math.pow(Math.E, args[0]) / sum;
    }, 
    "softmax",
    function(variableOfDiff, ...args) {
            return new Divide(new Power(new Const(Math.E), args[0]), new Sumexp(...args)).diff(variableOfDiff);
        }
);


const Sumexp = AbstractOperation(
    function(...args) {
        let sum = args.reduce(function(nsum, cur){
            return nsum + Math.pow(Math.E, cur); 
        }, 0);
        return sum;
    }, 
    "sumexp",
    function(variableOfDiff, ...args) {
            return new Sum(...args.map(x => new Power(new Const(Math.E), x).diff(variableOfDiff)));
        }   
    
);

// :NOTE: duplicated variable names declaration
const isVariable = function(c) {
    return (c in mapVariableName);
}

const isDigit = function(c) {
    return c >= "0" && c <= "9";
}

const isNumber = function(str) {
    if (str === "") return false;
    let startDigits = 0;
    if (str[0] == '-') {
        if (str.length === 1) return false;
        startDigits = 1;
        str = str.slice(1);
    }
    return str.split('').reduce(function(flag, cur) {
        return flag && isDigit([cur]);
    }, true);
}

const mapOperators = {
        "negate": Negate,
        "+" : Add,
        "-" : Subtract,
        "*" : Multiply,
        "/" : Divide,
        "pow": Power,
        "log": Log,
        "sumexp": Sumexp,
        "softmax": Softmax
};

const parse = function(source) {
        source = source.trim();
        let arrFromTheSource = source.split(/[' ']+/);
        let result = arrFromTheSource.reduce(function(stack, cur){
            let operator;
            let arity;
            if (cur in mapOperators){
                operator = mapOperators[cur];
                arity = (new operator()).arity;
            } else {
                arity = 1;
                stack.push(cur);
                if(isVariable(cur)) {
                    operator = Variable;
                } else {
                    operator = Const;
                }
            }
            let args = stack.slice(stack.length - arity);
            stack.length -= arity;
            stack.push(new operator(...args));
            return stack;
        }, [] );
        return result.pop();
};

// :NOTE: too many code for parser. Limit is 50-60 lines (without blank lines)

function Source(str) {
    this.str = str;
    this.length = str.length;
    this.cur = 0;
    this.token = "DEFAULT";
    this.isCurThat = function(c) {
        return this.str[this.cur] === c;
    };
    this.isCurBracket = function() {
        return this.isCurThat("(") || this.isCurThat(")");
    };
    this.skipWhitespace = function() {
        while(this.isCurThat(" ") && this.cur < this.str.length) {
            this.cur++;
        }
    };
    this.getToken = function() {
        if (!this.isCurBracket()) {
            let savedInd = this.cur;
            while(!this.isCurThat(" ") && !this.isCurBracket() && this.cur < this.length) {
                this.cur++;
            }
            this.token = this.str.slice(savedInd, this.cur);
        } else {
            this.token = this.str[this.cur];
            this.cur++;
        }
        this.skipWhitespace();
    };
}

const Parser = function(str, mode) {
    const source = new Source(str);
    source.skipWhitespace();
    source.getToken();
    const expr = parsingFunction();
    if (source.cur < source.length) {
        throw new UnexpectedTailException(source.cur);
    }
    return expr;
    function parsingFunction() {
        if (source.token === "(") {
            source.getToken();
            let args = [];
            if (mode === "postfix") {
                parseOperand(mode, args);
            }
            if (source.token in mapOperators) {
                let operator = source.token;
                source.getToken();
                if (mode === "prefix") {
                    parseOperand(mode, args);
                }
                if (source.token !== ")") {
                    throw new UnclosedBracketException(source.cur);
                }
                let nameOperator = operator;
                operator = new mapOperators[operator](...args);
                if (args.length > operator.arity && operator.arity !== 0) {
                    throw new TooManyOperandsException(nameOperator, source.cur);
                }
                if (args.length < operator.arity && operator.arity !== 0) {
                    throw new NotEnoughOperandsException(nameOperator, source.cur);
                }
                return operator;
            }
            else {
                throw new IllegalOperationException(source.cur);
            }
        } else if (isNumber(source.token)) {
            return new Const(parseInt(source.token));
        } else if (isVariable(source.token)) {
            return new Variable(source.token);
        } else {
            throw new IllegalOperandException(source.cur);
        }
    }
    function parseOperand(mode, args) {
        while ((mode == "postfix" ? (!(source.token in mapOperators) && source.cur < source.length) : (source.token !== ")" && source.cur < source.length))) {
                    args.push(parsingFunction());
                    source.getToken();
                }
    }
}

const parsePrefix = function(source) {
    return Parser(source, "prefix");
}

// :NOTE: this is the same as `parsePrefix`just with other order of elements (copy-paste)
// :NOTE: still be copy-pasted
const parsePostfix = function(source) {
    return Parser(source, "postfix");
}

function MyException(name, message) {
    const p = function(...args) {
        this.name = name;
        this.message = message(...args);
    };
    p.prototype = new Error;
    return p;
}

const UnclosedBracketException = MyException(
    "UnclosedBracketException", 
    function(ind) {
        return "Expected closing bracket in position: " + ind;
    }
)

const NotEnoughOperandsException = MyException(
    "NotEnoughOperandsException", 
    function(operator, ind) {
        return "Expected more operands for operator <" + operator + "> in position: " + ind;
    }
)

const TooManyOperandsException = MyException(
    "TooManyOperandsException", 
    function(operator, ind) {
        return "Expected less operands for operator <" + operator + "> in position: " + ind;
    }
)

const IllegalOperationException = MyException(
    "IllegalOperationException", 
    function(ind) {
        return "Incorrect operation in position: " + ind;
    }
)


const IllegalOperandException = MyException(
    "IllegalOperandException", 
    function(ind) {
        return "Incorrect operand in position: " + ind;
    }
)

const UnexpectedTailException = MyException(
    "UnexpectedTailException", 
    function(ind) {
        return "There some tail, that can't be parsed. From position: " + ind;
    }
)
