'use strict';

(function()
{
	var mainModule = angular.module('myApp.controllers', []);
	mainModule.controller('MyCtrl1', ['$scope', 'd3Service', Controller_1]);
	mainModule.controller('MyCtrl2', ['$scope', 'd3Service', Controller_3]);
	//////////////////////////////////////////////////////////////

	function Controller_1($scope, d3)
	{
		console.log('in Controller_1');
		var width;
		var height;
		var root;
		var force;
		var svg;
		var link;
		var node;

		init();

		function init()
		{
			width = 1000;
			height = 500;

			force = d3.layout.force()
				.linkDistance(80)
				.charge(-120)
				.gravity(.05)
				.size([width, height])
				.on("tick", tick);

			svg = d3.select("body").
				append("svg").
				attr("width", width).
				attr("height", height);

			link = svg.selectAll(".link");
			node = svg.selectAll(".node");

			d3.json("graph.json", function(error, json) {
				root = json;
				update();
			});

			registerForClear();
		}

		function registerForClear()
		{
			$scope.$on('$stateChangeStart',
				function(event, toState, toParams, fromState, fromParams)
				{
					if(fromState.name == 'view1')
					{
						clear();
					}
				});
		}

		function clear()
		{
			//svg.selectAll('*').remove();
			d3.select("svg").remove();
		}

		function update()
		{
			var nodes = flatten(root);
			var links = d3.layout.tree().links(nodes);

			// Restart the force layout.
			force.nodes(nodes).links(links).start();

			// Update links.
			link = link.data(links, function(d) { return d.target.id; });

			link.exit().remove();

			link.enter().insert("line", ".node").attr("class", "link");

			// Update nodes.
			node = node.data(nodes, function(d) { return d.id; });

			node.exit().remove();

			var nodeEnter = node.enter().append("g")
				.attr("class", "node")
				.on("click", click)
				.call(force.drag);

			nodeEnter.append("circle").attr("r", function(d) { return Math.sqrt(d.size) / 10 || 4.5; });

			nodeEnter.append("text").attr("dy", ".35em").text(function(d) { return d.name; });

			node.select("circle").style("fill", color);
		}

		function tick()
		{
			link.attr("x1", function(d) { return d.source.x; })
				  .attr("y1", function(d) { return d.source.y; })
				  .attr("x2", function(d) { return d.target.x; })
				  .attr("y2", function(d) { return d.target.y; });

			node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
		}

		function color(d) {
			return d._children ? "#3182bd" // collapsed package
				: d.children ? "#c6dbef" // expanded package
				: "#fd8d3c"; // leaf node
		}

		// Toggle children on click.
		function click(d)
		{
			if (d3.event.defaultPrevented) return; // ignore drag
			if (d.children)
			{
				d._children = d.children;
				d.children = null;
			}
			else
			{
				d.children = d._children;
				d._children = null;
			}
			update();
		}

		// Returns a list of all nodes under the root.
		function flatten(root)
		{
			var nodes = [];
			var i = 0;

			function recurse(node)
			{
				if (node.children) node.children.forEach(recurse);
				if (!node.id) node.id = ++i;
				nodes.push(node);
			}

			recurse(root);
			return nodes;
		}
	}

	function Controller_2($scope, d3)
	{
		console.log('in Controller_2');

		////// core ///////
		d3.custom = {};
		d3.custom.chart = {};
		d3.custom.layout = {};

		//// chart script ///////
		d3.custom.chart.flow = function()
		{

			// public variables with default settings
			var margin = {top:10, right:10, bottom:10, left:10}, // defaults
				padding = {top:20, right:10, bottom:10, left:10},
				transitionDuration = 300,
				chartGroup,
				container,
				svg,
				width,
				height,
				root,
				rootNode,
				scrollbarAffordance;

			var flow = d3.custom.layout.flow()
				.margin(margin)
				.padding(padding)
				.nodeWidth(110)
				.nodeHeight(30)
				.containerHeight(20);

			function chart(selection) {
				rootNode = selection.node();

				function debounce(fn, timeout) {
					var timeoutID = -1;
					return function() {
						if (timeoutID > -1) {
							window.clearTimeout(timeoutID);
						}
						timeoutID = window.setTimeout(fn, timeout);
					}
				}

				function resize(selectedNode) {
					var domContainerWidth  = (parseInt(d3.select(rootNode).style("width"))),
						domContainerHeight = (parseInt(d3.select(rootNode).style("height"))),
						flowWidth = 0;

					if (root.height > domContainerHeight) {
						scrollbarAffordance = 0;
					} else {
						scrollbarAffordance = 0;
					}

					flowWidth = domContainerWidth - scrollbarAffordance;
					flow.width(flowWidth);

					chart.update(selectedNode);

					svg.transition().duration(transitionDuration)
						.attr("width", function(d) {
							return domContainerWidth;
						})
						.attr("height", function(d) {
							return d.height + margin.top + margin.bottom;
						})
						.select(".chartGroup")
						.attr("width", function(d) {
							return flowWidth;
						})
						.attr("height", function(d) {
							return d.height + margin.top + margin.bottom;
						})
						.select(".background")
						.attr("width", function(d) {
							return flowWidth;
						})
						.attr("height", function(d) {
							return d.height + margin.top + margin.bottom;
						});
				}


				d3.select(window).on('resize', function() {
					debounce(resize, 50)();
				});

				$(rootNode).on("resize", function() {
					debounce(resize, 50)();
				});

				selection.each(function(arg) {
					root = arg;
					container = d3.select(this);

					var i = 0;

					if (!svg) {
						svg = container.append("svg")
							.attr("class", "svg chartSVG")
							.attr("transform", "translate(0, 0)")
							.style("shape-rendering", "auto") // shapeRendering options; [crispEdges|geometricPrecision|optimizeSpeed|auto]
							.style("text-rendering", "auto"); // textRendering options;  [auto|optimizeSpeed|optimizeLegibility|geometricPrecision]
						chartGroup = svg.append("svg:g")
							.attr("class", "chartGroup");
						chartGroup.append("svg:rect")
							.attr("class", "background");
					}


					chart.update = function(source) {
						var nodes = flow(root);

						function color(d) {
							return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
						}

						// Toggle children on click.
						function click(d) {
							if (d.children) {
								d._children = d.children;
								d.children = null;
							} else {
								d.children = d._children;
								d._children = null;
							}
							resize(d);
						}

						// Update the nodes…
						var node = chartGroup.selectAll("g.node")
							.data(nodes, function(d) { return d.id || (d.id = ++i); });

						var nodeEnter = node.enter().append("svg:g")
							.attr("class", "node")
							.attr("transform", function(d) {
								return "translate(" + source.x + "," + source.y + ")";
							})
							.style("opacity", 1e-6);

						// Enter any new nodes at the parent's previous position.
						nodeEnter.append("svg:rect")
							.attr("class", "background")
							.attr("height", function(d) { return d.height; })
							.attr("width", function(d) { return d.width; })
							.style("fill", color)
							.on("click", click);

						nodeEnter.each(function(d) {
							if (d.children || d._children) {
								d3.select(this)
									.append("path")
									.attr("class", "expander")
									.attr("d", "M 0 0 L 6 6 L 0 6 z")
									.attr("transform", function(d) {
										return d._children ? "translate(8,14)rotate(225)" : "translate(5,8)rotate(315)";
									});
								d3.select(this).append("svg:text")
									.attr("class", "label")
									.attr("dy", 13)
									.attr("dx", 17)
									.text(function(d) { return d.name; });
							} else {
								d3.select(this).append("svg:text")
									.attr("class", "label")
									.attr("dy", 13)
									.attr("dx", 4)
									.text(function(d) { return d.name; });
							}
						});

						// Transition nodes to their new position.
						nodeEnter.transition()
							.duration(transitionDuration)
							.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
							.style("opacity", 1);

						var nodeUpdate = node.transition()
							.duration(transitionDuration);

						nodeUpdate.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
							.style("opacity", 1)
							.select("rect")
							.style("fill", color);

						nodeUpdate.each(function(d) {
							if (d.children || d._children) {
								d3.select(this).select(".expander").transition()
									.duration(transitionDuration)
									.attr("transform", function(d) {
										return d._children ? "translate(8,14)rotate(225)" : "translate(5,8)rotate(315)";
									});
							}
						});

						nodeUpdate.select(".background")
							.attr("height", function(d) { return d.height; })
							.attr("width", function(d) { return d.width; });

						// Transition exiting nodes to the parent's new position.
						node.exit().transition()
							.duration(transitionDuration)
							.attr("transform", function(d) { return "translate(" + source.x + "," + source.y + ")"; })
							.style("opacity", 1e-6)
							.remove();
					};

					resize(root);
					chart.update(root);

				});
			}

			chart.width = function(value) {
				if (!arguments.length) return width;
				width = parseInt(value);
				return this;
			};

			chart.height = function(value) {
				if (!arguments.length) return height;
				height = parseInt(value);
				return this;
			};

			chart.margin = function(_) {
				if (!arguments.length) return margin;
				margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
				margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
				margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
				margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
				return chart;
			};

			return chart;
		};

		////// layout script /////////
		d3.custom.layout.flow = function() {

			var hierarchy = d3.layout.hierarchy().sort(null).value(null),
				nodeWidth = 125,
				nodeHeight = 50,
				containerHeight = 20,
				width = 900,
				height = 0,
				padding = {top:20, left:10, bottom:10, right:10},
				margin = {top:10, left:10, bottom:10, right:10};

			function flow(d, i) {
				var nodes = hierarchy.call(this, d, i),
					root = nodes[0];


				function firstWalk(node) {
					var children = node.children;
					if (children && children.length > 0) {
						var n = children.length,
							i = -1,
							child;

						while (++i < n) {
							child = children[i];
							firstWalk(child);
						}

						gridLayout(node, children, node.depth);
					} else {
						node.width = node._children ? width - (node.depth * (padding.left + padding.right)) - (padding.left + padding.right) : nodeWidth;
						node.height = node._children ? containerHeight : nodeHeight;
					}
				}


				function secondWalk(node) {
					var children = node.children;
					if (children && children.length > 0) {
						var i = -1,
							n = children.length,
							child;
						while (++i < n) {
							child = children[i];
							child.x += node.x;
							child.y += node.y;
							secondWalk(child);
						}
					}
				}


				function gridLayout(node, children, depth) {
					var paddingValue = node.parent ? padding.left + padding.right : margin.left + margin.right;
					var availableWidth = width - (depth * (paddingValue)) - (paddingValue),
						currentX = padding.left,
						currentY = padding.top,
						tallestChildHeight = 0;

					children.forEach(function(child) {
						if ((currentX + child.width + padding.right) >= availableWidth) {
							currentX = padding.right;
							currentY += tallestChildHeight;
							tallestChildHeight = 0;
						}
						child.x = currentX;
						child.y = currentY;
						currentX += child.width + padding.right;
						tallestChildHeight = Math.max(tallestChildHeight, child.height + padding.bottom);
					});
					node.width = availableWidth;
					node.height = currentY + tallestChildHeight;
					node.x = node.parent ? padding.left : margin.left;
					node.y = node.parent ? padding.top  : margin.top;
				}


				firstWalk(root);
				secondWalk(root);
				height = root.height;

				return nodes;
			}

			flow.padding = function(_) {
				if (!arguments.length) return padding;
				padding.top    = typeof _.top    != 'undefined' ? _.top    : padding.top;
				padding.right  = typeof _.right  != 'undefined' ? _.right  : padding.right;
				padding.bottom = typeof _.bottom != 'undefined' ? _.bottom : padding.bottom;
				padding.left   = typeof _.left   != 'undefined' ? _.left   : padding.left;
				return this;
			};

			flow.margin = function(_) {
				if (!arguments.length) return margin;
				flow.top    = typeof _.top    != 'undefined' ? _.top    : flow.top;
				flow.right  = typeof _.right  != 'undefined' ? _.right  : flow.right;
				flow.bottom = typeof _.bottom != 'undefined' ? _.bottom : flow.bottom;
				flow.left   = typeof _.left   != 'undefined' ? _.left   : flow.left;
				return this;
			};

			flow.width = function(value) {
				if (!arguments.length) return width;
				width = parseInt(value);
				return this;
			};

			flow.height = function(value) {
				if (!arguments.length) return height;
				height = parseInt(value);
				return this;
			};

			flow.nodeWidth = function(value) {
				if (!arguments.length) return nodeWidth;
				nodeWidth = parseInt(value);
				return this;
			};

			flow.nodeHeight = function(value) {
				if (!arguments.length) return nodeHeight;
				nodeHeight = parseInt(value);
				return this;
			};

			flow.containerHeight = function(value) {
				if (!arguments.length) return containerHeight;
				containerHeight = parseInt(value);
				return this;
			};

			return flow;
		};

		//////////////////////////////

		d3.json("xflare.json", function(data)
		{
			var flowTree = d3.custom.chart.flow();
			d3.select('#flowtree').datum(data).call(flowTree);
		});

	}

	function Controller_3($scope, d3)
	{
		var mMargin = {top: 20, right: 120, bottom: 20, left: 120};
		var mWidth = 960 - mMargin.right - mMargin.left;
		var mHeight = 800 - mMargin.top - mMargin.bottom;

		var mNodeRunningId = 0;
		var	mDuration = 3000;
		var	mTreeRoot;

		var mD3LayoutTree = d3.layout.tree().size([mHeight, mWidth]);

		var mD3Diagonal = d3.svg.diagonal().projection(function(d) { return [d.y, d.x]; });

		var mD3Svg = d3.select(".collapsible_tree").append("svg")
			.attr("width", mWidth + mMargin.right + mMargin.left)
			.attr("height", mHeight + mMargin.top + mMargin.bottom)
			.append("g")
			.attr("transform", "translate(" + mMargin.left + "," + mMargin.top + ")");

		d3.json("resources/collapsible_tree.json", function(error, treeJsonObject) {
			mTreeRoot = treeJsonObject;
			mTreeRoot.x0 = mHeight / 2;
			mTreeRoot.y0 = 0;

			function collapse(d)
			{
				if (d.children)
				{
					d._children = d.children;
					d._children.forEach(collapse);
					d.children = null;
				}
			}

			mTreeRoot.children.forEach(collapse);
			update(mTreeRoot);
		});

		d3.select(self.frameElement).style("height", "800px");

		function update(source)
		{
			// Compute the new tree layout.
			var nodes = mD3LayoutTree.nodes(mTreeRoot).reverse();
			var links = mD3LayoutTree.links(nodes);

			// Normalize for fixed-depth.
			nodes.forEach(function(d) { d.y = d.depth * 180; });

			// Update the nodes…
			var svgNodes = mD3Svg.selectAll("g.node").data(nodes, function(d) { return d.id || (d.id = ++mNodeRunningId); });
			EnterNodes(svgNodes);
			UpdateNodes(svgNodes);
			RemoveNodes(svgNodes);

			// Update the links…
			var svgLink = mD3Svg.selectAll("path.link")
				.data(links, function(d) { return d.target.id; });
			EnterLinks(svgLink);
			UpdateLinks(svgLink);
			RemoveLinks(svgLink);

			SaveNodesOldPos(nodes);

			function EnterNodes(svgNodes)
			{
				// Enter any new nodes at the parent's previous position.
				var nodeEnter = svgNodes.enter()
					.append("g")
					.attr("class", "node")
					.attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
					.on("click", click);

				nodeEnter.append("circle")
					.attr("r", 1e-6)
					.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

				nodeEnter.append("text")
					.attr("x", function(d) { return d.children || d._children ? -10 : 10; })
					.attr("dy", ".35em")
					.attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
					.text(function(d) { return d.name; })
					.style("fill-opacity", 1e-6);
			}
			function UpdateNodes(svgNodes)
			{
				// Transition nodes to their new position.
				var nodeUpdate = svgNodes.transition()
					.duration(mDuration)
					.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

				nodeUpdate.select("circle")
					.attr("r", 4.5)
					.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

				nodeUpdate.select("text")
					.style("fill-opacity", 1);
			}
			function RemoveNodes(svgNodes)
			{
				// Transition exiting nodes to the parent's new position.
				var nodeExit = svgNodes.exit().transition()
					.duration(mDuration)
					.attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
					.remove();

				nodeExit.select("circle")
					.attr("r", 1e-6);

				nodeExit.select("text")
					.style("fill-opacity", 1e-6);
			}
			function EnterLinks(svgLinks)
			{
				// Enter any new links at the parent's previous position.
				svgLinks.enter()
					.insert("path", "g")
					.attr("class", "link")
					.attr("d", function(d) {
						var o = {x: source.x0, y: source.y0};
						return mD3Diagonal({source: o, target: o});
					});
			}
			function UpdateLinks(svgLinks)
			{
				// Transition links to their new position.
				svgLinks.transition()
					.duration(mDuration)
					.attr("d", mD3Diagonal);
			}
			function RemoveLinks(svgLinks)
			{
				// Transition exiting nodes to the parent's new position.
				svgLink.exit().transition()
					.duration(mDuration)
					.attr("d", function(d) {
						var o = {x: source.x, y: source.y};
						return mD3Diagonal({source: o, target: o});
					})
					.remove();
			}
			function SaveNodesOldPos(nodes)
			{
				// Stash the old positions for transition.
				nodes.forEach(function(d) {
					d.x0 = d.x;
					d.y0 = d.y;
				});
			}
		}

// Toggle children on click.
		function click(d) {
			if (d.children) {
				d._children = d.children;
				d.children = null;
			} else {
				d.children = d._children;
				d._children = null;
			}
			update(d);
		}

	}

})();
