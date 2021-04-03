;review HW11


(defn abstractOperation [f]
    (fn [& args]
  (fn [vars](
    apply f (mapv #(% vars) args)))))

(defn variable [name] (fn [vars] (vars name)))
(def constant constantly)

(def divide (abstractOperation #(/ %1 (double %2))))
(def multiply (abstractOperation *))
(def subtract (abstractOperation -))
(def add (abstractOperation +))
(def negate (abstractOperation #(- %)))
(def avg (abstractOperation (fn [& args] (/ (apply + args) (count args)))))
(def med (abstractOperation (fn [& args] (nth (sort args) (/ (count args) 2)))))


(def operations
    {'+      add
    'negate negate
    '-      subtract
    '*      multiply
    '/      divide
    'avg    avg
    'med    med})

(defn parse [expr]
  (cond
    (list? expr)
    (apply (operations (first expr))
           (map parse (rest expr)))
    (number? expr) (constant expr)
    :else (variable (str expr))))

(defn parseFunction [expression]
  (parse (read-string expression)))


  
  
  
  

(defn proto-get [obj key]
      (cond
        (contains? obj key) (obj key)
        (contains? obj :prototype) (proto-get (obj :prototype) key)
        :else nil))

(defn proto-call [this key & args]
      (apply (proto-get this key) this args))

(defn field [key]
      (fn [this] (proto-get this key)))

(defn method [key]
      (fn [this & args] (apply proto-call this key args)))

(def toString (method :toString))
(def evaluate (method :evaluate))
(def diff (method :diff))
(def operands (field :operands))


(defn Constant [val]
      (let [number (field :value)]
      {
        :value     val
        :toString #(let [value (number %)] (format "%.1f" value))
        :evaluate (fn [this _]
                      (number this))
        (comment ":NOTE: pre-define constants and use `ZERO`, `ONE`, ...")
        :diff (fn [_ _] (Constant 0))}))

(defn Variable [identifier]
    (let  [name (field :value)]
        {:value     identifier
        :toString #(name %)
        :evaluate #(%2 (name %1))
        :diff     #(if (= (name %1) %2) (Constant 1) (Constant 0))}))

        
(def abstractOperation
  (let [operands (field :operands)
        sign (field :sign)
        operation (field :operation)
        diffRule (field :diffRule)]
       {:toString #(str "(" (sign %) " " (clojure.string/join " " (mapv toString (operands %))) ")")
        :evaluate #(apply (operation %1) (mapv (fn [operand] (evaluate operand %2)) (operands %1)))
        :diff     (fn [this vars](let [
                                    args (operands this)
                                    diffed (mapv #(diff % vars) args)
                                    ]
                                        ((diffRule this) args diffed)))}))

                                        
(defn create-operation
      [sign operation diffRule]
      (fn [& operands]
          {:prototype {:prototype  abstractOperation
                       :sign   sign
                       :operation   operation
                       :diffRule diffRule}
           :operands  (vec operands)}))

           
(def Add (create-operation '+ + #(apply Add %2)))

(def Subtract (create-operation '- - #(apply Subtract %2)))

(def Multiply (create-operation '* * (fn [args diffed]
                                         (Add (Multiply (args 0) (diffed 1))
                                              (Multiply (args 1) (diffed 0))))))

(def Divide (create-operation '/ (fn [x y] (/ x (double y)))
                              (fn [args diffed] (Divide (Subtract (Multiply (args 1) (diffed 0))
                                                               (Multiply (args 0) (diffed 1)))
                                                     (Multiply (args 1) (args 1))))))

(def Negate (create-operation 'negate - (fn [args diffed] (apply Negate diffed))))

(def Sum (create-operation 'sum 
+ 
(fn [args diffed] (apply Sum diffed))))

(def Avg (create-operation 'avg 
    (fn [& opers] (/ (apply + opers) (double (count opers))))
    (fn [args diffed] (Divide (apply Sum diffed) (Constant (count args))))))

(def objectOperations
  {
   '+      Add
   '-      Subtract
   '*      Multiply
   '/      Divide
   'negate Negate
   'sum Sum
   'avg Avg
   })

(defn parseObjectExpression [expr]
      (cond
        (seq? expr) (apply (objectOperations (first expr)) (mapv parseObjectExpression (rest expr)))
        (number? expr) (Constant expr)
        :else (Variable (str expr))))

(def parseObject (comp parseObjectExpression read-string))




(def Log (create-operation "//" 
    #(/  (Math/log (Math/abs %2))  (double (Math/log (Math/abs %1))))
    nil))
    
(def Pow (create-operation "**" 
    #(Math/pow %1 %2)
    nil))
