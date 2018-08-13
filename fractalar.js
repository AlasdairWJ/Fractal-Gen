/*

TOOLS:
	create node
	delete node
	move node

*/

var screen_width = 1280;
var screen_height = 720;
var origin = new v2(screen_width / 2, screen_height / 2);

var colours = {
	black: makecol(0,0,0),
	red: makecol(255,0,0),
	green: makecol(0,255,0),
	white: makecol(255,255,255),
	lightgrey: makecol(224,224,224),
	grey: makecol(128,128,128)
};

var tri_ratio = Math.sqrt(3.0) / 2.0;

var grid_size = 40;
var tri_size = grid_size * tri_ratio;

var left_node = new v2(origin.x - screen_width / 4, origin.y);
var right_node = new v2(origin.x + screen_width / 4, origin.y);
var nodes = [left_node, right_node];
var connections = [false];
var display_mode = 0;

var hovering_node = -1;
var moving_node = -1;
var hovering_line = -1;

var num_iterations = 5;

var mouse_pos = new v2(0.0, 0.0);

var triangle_grid_mode = false;

function round_to_nearest(x, base) {
	return Math.round(x / base) * base;
}

function snap_to_square_grid(pos) {
	return new v2(round_to_nearest(pos.x, grid_size), round_to_nearest(pos.y, grid_size));
}

function snap_to_triangle_grid(pos) {
	var py = Math.round(pos.y / tri_size);
	var dx = (Math.abs(py) % 2) / 2.0;
	var px = (dx == 0 ? Math.round : Math.ceil)((pos.x + dx) / grid_size) - dx;
	return new v2(px * grid_size, py * tri_size);
}

function snap_to_grid(pos) {
	if (triangle_grid_mode) {
		return snap_to_triangle_grid(pos);
	} 
	return snap_to_square_grid(pos);
}

function get_line(i) {
	return [nodes[i], nodes[i + 1]];
}

function last_node() {
	return nodes[nodes.length - 1];
}

function project_line(P, A, B) {
	return v2_project(P.sub(A), B.sub(A).norm());
}

function get_node_under_mouse() {
	for (var i = 0; i < nodes.length; i++) {
		if (mouse_pos.dist(nodes[i]) < 6) {
			return i;
		}
	}
	return -1;
}

function bisect(line_id) {
	var L = get_line(line_id);
	var P = v2_interpol(L[0], L[1], 0.5);
	nodes.splice(line_id + 1, 0, P);
	connections.splice(line_id, 0, connections[line_id]);
}

function form_instructions() { //project_line(P, A, B)
	var inst = [];
	var total_len = nodes[0].dist(last_node());
	for (var i=1; i<nodes.length - 1; i++) {
		inst.push(project_line(nodes[i], nodes[0], last_node()).div(total_len));
	}
	return inst;
}

function remove_node(node_id) {
	if (nodes.length > 2) {
		nodes.splice(node_id, 1);
		connections.splice(node_id + 1, 1);
	}
}

function get_line_under_mouse() {
	for (var i = 0; i < nodes.length - 1; i++) {
		var L = get_line(i);
		var l = L[0].dist(L[1]);
		var P = project_line(mouse_pos, L[0], L[1])
		if (P.x > 0 && P.x < l) {
			var nl = Math.abs(P.y);
			if (nl < 6) {
				return i;
			}
		}
	}
	return -1;
}

function left_click_node() {
	moving_node = hovering_node;
}

function right_click_node() {
	remove_node(hovering_node);
}

function left_click_line() {
	if (nodes.length < 10) {
		bisect(hovering_line);
	}
}

function right_click_line() {
	connections[hovering_line] = !connections[hovering_line];
}

function calculate_lengths() {
	var line_lengths = [];
	var base = nodes[0].dist(last_node());
	for (var i=1; i<nodes.length; i++) {
		line_lengths.push(nodes[i-1].dist(nodes[i]) / base);
	}
	return line_lengths;
}

function test_dimension(line_lengths, D) {
	var total = 0.0;
	for (var i=0; i<line_lengths.length; i++) {
		total += Math.pow(line_lengths[i], D);
	}
	return total;
}

function find_dimension(line_lengths, lower, upper, i) {
	var mid = (lower + upper) / 2.0;
	if (i == 0) { return mid; }

	var value = test_dimension(line_lengths, mid);
	if (value < 1.0) {
		return find_dimension(line_lengths, lower, mid, i - 1);
	}
	if (value > 1.0) {
		return find_dimension(line_lengths, mid, upper, i - 1);
	}
	return mid;
}

function are_lengths_valid(line_lengths) {
	for (var i=0; i<line_lengths.length; i++) {
		if (2.0 * line_lengths[i] > Math.sqrt(2.0)) {
			return false;
		}
	}
	return true;
}

function calculate_dimension() {
	var line_lengths = calculate_lengths();
	console.log(line_lengths);
	if (line_lengths.length < 2) {
		return 1.0;
	}
	if (! are_lengths_valid(line_lengths)) {
		return NaN;
	}
	return Math.min(2.0, find_dimension(line_lengths, 0.0, 4.0, 10));
}

function update_nodes() {
	hovering_node = get_node_under_mouse();
	if (hovering_node == -1) {
		hovering_line = get_line_under_mouse();
	} else {
		hovering_line = -1;
	}

	var left_click = mouse_pressed & 1;
	var right_click = mouse_pressed & 4;

	if (left_click) {
		if (hovering_node != -1) {
			left_click_node();
		} else if (hovering_line != -1) {
			left_click_line();
		}
	} else if (right_click) {
		if (hovering_node != -1) {
			right_click_node();
		} else if (hovering_line != -1) {
			right_click_line();
		}
	}

	if (moving_node != -1) {
		var mouse_snap_pos = snap_to_grid(mouse_pos.sub(origin)).add(origin);

		nodes[moving_node].x = mouse_snap_pos.x;
		nodes[moving_node].y = mouse_snap_pos.y;
	}

	if (mouse_released & 1) {
		moving_node = -1;
	}
}

function update_mouse() {
	mouse_pos.x = mouse_x;
	mouse_pos.y = mouse_y;
}

function update() {
	update_mouse();

	if (pressed[KEY_SPACE]) {
		display_mode = 1 - display_mode;
	}

	if (pressed[KEY_DOWN]) {
		if (num_iterations > 1) {
			num_iterations--;
		}
	}

	if (pressed[KEY_A]) {
		var D = calculate_dimension();
		console.log(D);
	}

	if (pressed[KEY_G]) {
		triangle_grid_mode = !triangle_grid_mode;
	}

	if (pressed[KEY_UP]) {
		if (num_iterations < 10) {
			num_iterations++;
		}
	}

	if (! display_mode) {
		update_nodes();
	}
}

function v2_draw_line(A, B, line_colour, line_size) {
	line(canvas, A.x, A.y, B.x, B.y, line_colour, line_size);
}

function v2_draw_circle(A, radius, fill_colour) {
	circlefill(canvas, A.x, A.y, radius, fill_colour);
}

function draw_node(P, fill_colour) {
	v2_draw_circle(P, 6, colours.black);
	v2_draw_circle(P, 4, fill_colour);
}

function draw_connections() {
	for (var i = 0; i < nodes.length - 1; i++) {
		var L = get_line(i);
		var D = L[1].sub(L[0]);
		var N = D.perp();
		var M = L[0].add(D.div(2.0));
		var flipped = connections[i];
		N = N.div(4 * (flipped ? -1 : 1));
		v2_draw_line(M, M.add(N), colours.green, 2);
		v2_draw_line(L[0], L[1], i == hovering_line ? colours.red : colours.black, 4);
	}
}

function draw_all_nodes() {
	for (var i = 0; i < nodes.length; i++) {
		draw_node(nodes[i], hovering_node == i || moving_node == i ? colours.red : colours.green);
	}
}

function draw_square_grid() {
	var num_blocks_horizontal = screen_width / grid_size | 0;
	var x_pos = origin.x % grid_size;
	for (var i = 0; i < num_blocks_horizontal; i++) {
		line(canvas, x_pos, 0, x_pos, screen_height, colours.lightgrey, 1);
		x_pos += grid_size;
	}

	var num_blocks_vertical = screen_width / grid_size | 0;
	var y_pos = origin.y % grid_size;
	for (var i = 0; i < num_blocks_vertical; i++) {
		line(canvas, 0, y_pos, screen_width, y_pos, colours.lightgrey, 1);
		y_pos += grid_size;
	}
}

function draw_triangle_grid() {

	var num_blocks_vertical = screen_width / tri_size | 0;
	var y_pos = origin.y % tri_size;
	for (var i = 0; i < num_blocks_vertical; i++) {
		line(canvas, 0, y_pos, screen_width, y_pos, colours.lightgrey, 1);
		y_pos += tri_size;
	}


	var triangle_base = screen_height / Math.sqrt(3.0);
	var half_tri_base = triangle_base / 2.0;
	var num_blocks_horizontal = (screen_width + triangle_base) / (2 * grid_size) | 0;
	var x_pos = -num_blocks_horizontal * grid_size;
	for (var i = -num_blocks_horizontal; i <= num_blocks_horizontal; i++) {
		line(canvas, x_pos - half_tri_base + origin.x, 0, x_pos + half_tri_base + origin.x, screen_height, colours.lightgrey, 1);
		line(canvas, x_pos + half_tri_base + origin.x, 0, x_pos - half_tri_base + origin.x, screen_height, colours.lightgrey, 1);
		x_pos += grid_size;
	}
}

function draw_fractal(A, B, instr, it, flip) {
	if (flip) {
		var temp = A;
		A = B;
		B = temp;
	}
	if (it == 0) {
		v2_draw_line(A, B, it == 0 ? colours.black : colours.grey, 2);
	} else {
		var P = B.sub(A);
		var N = P.perp();

		var prev = A;
		var i;
		for (i=0; i < instr.length; i++) {
			var modifier = instr[i];
			var next = A.add(P.mul(modifier.x)).add(N.mul(modifier.y));
			draw_fractal(prev, next, instr, it - 1, connections[i]);
			prev = next;
		}
		draw_fractal(prev, B, instr, it - 1, connections[i]);
	}
}

function draw() {
	if (! display_mode) {
		if (triangle_grid_mode) {
			draw_triangle_grid();
		} else {
			draw_square_grid();
		}
		
	}

	var instr = form_instructions();
	draw_fractal(nodes[0], last_node(), instr, num_iterations, false);

	if (! display_mode) {
		draw_connections();
		draw_all_nodes();
	}
}

function loop_fx() {
	clear_to_color(canvas, colours.white);
	update();
	draw();
}

function ready_fx() {
	loop(loop_fx, BPS_TO_TIMER(60))
}

function main()
{
	allegro_init_all("myCanvas", screen_width, screen_height);
	ready(ready_fx);
	return 0;
}

END_OF_MAIN();
