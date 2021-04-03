;; review

(defn checkForAllCounts [args] (
    every? #(= (count (first args)) (count %)) args
))

(defn checkForAllTypes [args] (
    every? #(= (type (first args)) (type %)) args
))

(defn checkVecs [args] (
    every? #(= (type %) (type [])) args 
))

(defn checkVecsIsString [args] (
    and (checkVecs args)
        (every?  #(every? (fn [z] (number? z)) %) args)
))

(defn checkVecIsString [x] (
    every? #(number? %) x
))

(defn transpose [x] (
    if (every? #(number? %) x)
    (mapv #(vector %) x)
    (apply mapv vector x)
))

(defn v*s [v & s]
    {}
    (let [multAllScal (apply * s)] 
    (mapv #(* % multAllScal) v)
    )
)

(defn operationOnCoordVector [f]
    (
        fn[& args] 
            {:pre [(or (checkVecsIsString args) (checkVecs args)) (checkForAllCounts args)]} 
            (apply mapv f args) 
    )
)

(def v+ 
    (
        operationOnCoordVector +
    )
)

(def v-
    (
        operationOnCoordVector -
    )
)

(def v*
    (
        operationOnCoordVector *
    )
)

(defn scalar [& args] 
    {:pre [(checkVecsIsString args)]}
    (
        reduce #(apply + (v* %1 %2)) args
    )
)

(defn det [a b] 
    {:pre  [(= (count a) (count b)) (= (count a) 3) (checkVecIsString a) (checkVecIsString b)]}
    (
    vector (- (* (nth a 1) (nth b 2)) (* (nth a 2) (nth b 1)))
    (- (* (nth a 2) (nth b 0)) (* (nth a 0) (nth b 2)))
    (- (* (nth a 0) (nth b 1)) (* (nth a 1) (nth b 0)))
))

(defn vect [& args] 
    {:pre [ (checkVecsIsString args)
            (every? #(= (count %) 3) args)]}
    (
        reduce (fn [a b] 
            {:pre [(= (count a) (count b))]} 
            (
            det a b
        )) args
    )
)

(defn m*s [ m & s]
    { :pre [(every? number? s)]}
    (let [multAllScal (apply * s)]
    (mapv #(v*s % multAllScal) m)
    )
)



(def m+
    (
        operationOnCoordVector v+
    )
)


(def m-
    (
        operationOnCoordVector v-
    )
)

(def m*
    (
        operationOnCoordVector v*
    )
)

(defn m*v [a b]
    {}
    (
        mapv (partial scalar b) a
    )
)

(defn sizeOfMx [x] (
    vector (count x) (count (transpose x))
)
)

(defn m*m [& args]
    (
        reduce (fn [a b]
        {:pre [(checkVecs a)(checkVecs b) (= (count (transpose a)) (count b))]}
        (
            mapv #(m*v (transpose b) %) a
        )) args
    )
)

(defn checkTensor [tensor]
  (if (every? number? tensor)
    true
    (if (not (checkForAllTypes tensor))
      false
      (if (checkForAllCounts tensor)
        (every? checkTensor (apply mapv vector tensor))
        false))))

(defn recursionTensor [f & tensors]
  {:pre [(or (number? (first tensors)) (checkForAllCounts tensors))]}
  (if (vector? (first tensors))
    (apply mapv (partial recursionTensor f) tensors)
    (apply f tensors)))

(defn tensorOperation [f] ( fn [& tensors]
  {:pre [(checkTensor (first tensors))]}
  (apply recursionTensor f tensors)))
  
  
(def t+ (tensorOperation +))
        
(def t- (tensorOperation -))


(def t* (tensorOperation *))
