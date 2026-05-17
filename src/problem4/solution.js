var sum_to_n_a = function(n) {
    if (n <= 0) return 0;
    return (n * (n + 1)) / 2;
};


var sum_to_n_b = function(n) {
    if (n <= 0) return 0;
    return n + sum_to_n_b(n - 1);
};


var sum_to_n_c = function(n) {
    if (n <= 0) return 0;
    return Array.from({ length: n }, (_, i) => i + 1)
                .reduce((prev, next) => prev + next, 0);
};