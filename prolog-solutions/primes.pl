%review

composite(0).
composite(1).

init(N) :- 
	sieve(2, N).
	
sieve(I, N) :- 
	I * I < N, 
	J is I * I, 
	I1 is I + 1,
	not sieve_J(I, J, N), 
	sieve_I(I1, I2), 
	sieve(I2, N).
	
sieve_I(I, J) :- 
	not composite(I),
	J is I, !; 
		I1 is I + 1, 
		sieve_I(I1, J).
	
sieve_J(I, J, N) :- 
	J < N, 
	assert(composite(J)), 
	J1 is J + I, 
	sieve_J(I, J1, N).

prime(N) :- 
	not composite(N).

ordered([]).
ordered([_]).
ordered([X,Y|Z]):- X =< Y , ordered([Y|Z]).

prime_divisors(1, []):- !.
prime_divisors(N, [N]) :- prime(N), !.

multAllList(N, Ans, []) :-
	N is Ans, !.

multAllList(N, Ans, [H | T]) :-
	prime(H),
	Ans1 is Ans * H,
	multAllList(N, Ans1, T).

prime_divisors(N, [H | T]) :-
  not(var(N)),
	prime_factor(N, H),
	N1 is N / H,
	prime_divisors(N1, T),
	ordered([H | T]), !.
	
prime_divisors(N, D) :-
 	var(N),
 	ordered(D), 
 	multAllList(N, 1, D), 
 	!.

 prime_factor(N, D) :-
    find_prime_factor(N, 2, D).


find_prime_factor(N, D, R) :-
    D*D =< N,
    (0 is N mod D
    -> (prime(D), R is D)
		;		(D1 is D + 1, find_prime_factor(N, D1, R))
    ).


prime_palindrome(N, K) :-
	prime(N),
	get_IntInK(N, K, R),
	reverse(R, RInv),
	palindrome(R, RInv).
	

get_IntInK(N, K, []):-
		N is 0, !.

get_IntInK(N, K, [H1 | T1]):-
			N1 is div(N , K),
			H1 is mod(N, K),
			get_IntInK(N1, K, T1).


palindrome([], []):- !.
palindrome([A], []):- fail, !.
palindrome([], [A]):- fail, !.

palindrome([H1 | T1], [H1 | T2]) :-
	palindrome(T1, T2).

	
