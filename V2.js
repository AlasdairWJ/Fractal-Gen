function v2(x, y) {
	this.x = x;
	this.y = y;
}

v2.prototype.copy = function() {
	return new v2(this.x, this.y);
}

v2.prototype.len = function () {
	return Math.sqrt(this.x * this.x + this.y * this.y)
}

v2.prototype.add = function(A) {
	return new v2(this.x + A.x, this.y + A.y);
}

v2.prototype.sub = function (A) {
	return new v2(this.x - A.x, this.y - A.y);
}

v2.prototype.mul = function (f) {
	return new v2(this.x * f, this.y * f);
}

v2.prototype.div = function (f) {
	return new v2(this.x / f, this.y / f);
}

v2.prototype.dist = function(A) {
	return A.sub(this).len();
}

v2.prototype.perp = function() {
	return new v2(this.y, -this.x);
}

v2.prototype.norm = function v2_norm(A) {
	return this.div(this.len())
}

function v2_interpol(A, B, f) {
	var ix = A.x + (B.x - A.x) * f;
	var iy = A.y + (B.y - A.y) * f;
	return new v2(ix, iy);
}

function v2_product(A, B) {
	return A.x * B.x + A.y * B.y;
}
	
function v2_project(P, D) { // v2_project(D, D) = { |D|, 0 }
	D = D.norm();
	return new v2(v2_product(P, D), v2_product(P, D.perp()))
}

v2.prototype.toString = function() {
	 return "{" + this.x + ", " + this.y + "}";
}