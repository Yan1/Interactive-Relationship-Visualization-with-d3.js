/**
 * Created by yanni on 2017/3/29.
 */

(function ($w) {
    'use strict';
    $w.DrawRelation = function (graph, wrapperId, options) {
        this.graph = graph;
        this.data = {
            nodes: [],
            links: []
        };
        this.wrapperId = wrapperId;
        this.$wrapper = $('#' + wrapperId);
        this.w = this.$wrapper.width();
        this.h = this.$wrapper.height();
        this.defaultOptions = {
            legend: true,
            filter: true,
            pulse: true,
            weaveNewBtn: false,
            lineTextField: 'name',
            allRelationTypeMap: {
                'legal representative': {
                    class: 'legal',
                    needShow: true,  // will appear in the filter box
                    needPulse: false  // disappear the pulse when the relationship is 法定代表
                }, 'invest': {
                    class: 'invest',
                    needShow: true,
                    needPulse: true  // the pulse will appear if the relationship is invest, and the size of pulse is determined by amount field
                }, 'serve': {
                    class: 'others',
                    needShow: true,
                    needPulse: false
                }, 'branch': {
                    class: 'branch',
                    needShow: false, // will not appear in the filter box
                    needPulse: false
                },'trade': {
                    class: 'trade',
                    needShow: false,
                    needPulse: true
                },'guarantee': {
                    class: 'guarantee',
                    needShow: false,
                    needPulse: true
                },'loan': {
                    class: 'loan',
                    needShow: false,
                    needPulse: true
                },'risk': {
                    class: 'risk',
                    needShow: false,
                    needPulse: true
                }
            },
            defaultRelationType: 'serve',    // if the type is undefined or unmatched, it would be classified as invest
            nodeRadius: {
                person: 25,
                company: 35,
                main: 50,
                pulse: 4
            },
            nodeTypeMap: {
                'main': ['#499FFF', '#4ACEFF', 'Root'],
                'company': ['#3FCDC5', '#48E7B5', 'Enterprise'],
                'person': ['#FF9751', '#FFB04A', 'Person']
            },
            fixNode: true,
            fixField: {
                'main': true,
                'isController': true
            },
            fixTotal: 0,
            splitAxiX: {
                1: [7/12],
                2: [4/12, 9/12],
                3: [3/12, 6/12, 9/12],
                4: [2/12, 5/12, 8/12, 11/12]
            }
        };
        this.options = $.extend({}, this.defaultOptions, options);
        //console.log(this.options)
    };

    $w.DrawRelation.prototype = {
        _inteRelationList: function () {
            var _this = this;
            var sour2TarWithType = {},
                inteRelationArr = [];
            $.each(this.graph.relationList, function (i, link) {
                if(!_this.options.allRelationTypeMap[link.relationType]) link.relationType = _this.options.defaultRelationType;  // if the relationType is unmatched, it would be classified as defaultRelationType (serve)
                var key = link.sourceEntity + '_' + link.targetEntity + link.relationType;
                if(sour2TarWithType[key] !== undefined) {
                    var currInteRelationItem = inteRelationArr[sour2TarWithType[key]];
                    currInteRelationItem.name = currInteRelationItem.name + ', ' + link.name;
                    currInteRelationItem.amount = Number(currInteRelationItem.amount) + Number(link.amount);
                } else {
                    inteRelationArr.push(link);
                    sour2TarWithType[key] = inteRelationArr.length - 1;
                }
            });
            this.graph.relationList = inteRelationArr;
            //console.log(this.graph.relationList, sour2TarWithType)
        },
        _formatData: function () {
            this._inteRelationList();
            this.data = {
                nodes: [],
                links: []
            };
            this.options.fixTotal = 0;

            // to filter the node and link
            var nodeListUniq = [],
                nodeListUniqCheck = {};
            $.each(this.graph.nodeList, function (i, node) {
                nodeListUniq.push(node);
                nodeListUniqCheck[node.id] = 1;
            });
            var linkListUniq = [];
            $.each(this.graph.relationList, function (i, link) {
                if(nodeListUniqCheck[link.sourceEntity] && nodeListUniqCheck[link.targetEntity]) {
                    linkListUniq.push(link);
                }
            });

            var nodeList = nodeListUniq,
                relationList = linkListUniq;
            var nodeIndexJson = {};
            var _this = this;
            $.each(nodeList, function (i, node) {
                var nodeItem = {
                    id: node.id,
                    name: node.entityName,
                    nodeType: node.entityType.toLowerCase(),
                    upstream: [],
                    downstream: []
                };
                if(node.main) {
                    nodeItem.nodeType = 'main';
                }

                $.each(_this.options.fixField, function (key, value) {
                    if(node[key] === value && !nodeItem.fixCount) {
                        nodeItem.fixCount = ++_this.options.fixTotal;
                    }
                });


                _this.data.nodes.push(nodeItem);


                nodeIndexJson[node.id] = {
                    index: i,
                    id: node.id,
                    name: nodeList[i].entityName,
                    nodeType: node.entityType
                }
            });
            var relationType = '',
                allRelationTypeMap = this.options.allRelationTypeMap;
            $.each(relationList, function (i, link) {
                relationType = allRelationTypeMap[link.relationType];
                // init the relationType which is needShow
                if(!allRelationTypeMap[link.relationType].needShow) {
                    allRelationTypeMap[link.relationType].needShow = true;
                }
                //console.log(nodeIndexJson, link)
                var sourceIndex = nodeIndexJson[link.sourceEntity].index,
                    targetIndex = nodeIndexJson[link.targetEntity].index;
                _this.data.nodes[targetIndex].upstream.push(sourceIndex);
                _this.data.nodes[sourceIndex].downstream.push(targetIndex);

                var linkItem = {
                    source: sourceIndex,
                    target: targetIndex,
                    relationType: relationType.class,
                    relationTypeChinese: link.relationType,
                    name: link.name,
                    amount: Number(link.amount)
                };
                if(linkItem[_this.options.lineTextField] === undefined) linkItem[_this.options.lineTextField] = link[_this.options.lineTextField];
                _this.data.links.push(linkItem);
            });

            var linkNumJson = {}; // note the links of relationship between A and B nodes
            $.each(this.data.links, function (i, link) {
                var sourceNum = Number(link.source),
                    targetNum = Number(link.target);
                var name = '' + Math.min(sourceNum, targetNum) + '-' + Math.max(sourceNum, targetNum);
                if(linkNumJson[name]) {
                    link.num = linkNumJson[name];
                    linkNumJson[name] += 1;
                } else {
                    link.num = 0;
                    linkNumJson[name] = 1;
                }
            });
            //console.log(this.data)

        },
        _initForce: function () {
            return d3.layout.force()
                .nodes(this.data.nodes)
                .links(this.data.links)
                .charge(-3000)
                //.gravity(.05)
                .linkDistance(160)
                .size([this.w, this.h])
        },
        _getSize: function (zoomG) {
            var scale = 1,
                translate = [0, 0];

            var transform = zoomG.attr('transform');
            if(transform && transform.indexOf(')') !== -1) {
                transform = transform.split(')');
                for(var i = 0; i < transform.length; i++) {
                    if(transform[i].indexOf('scale(') !== -1) {
                        scale = transform[i].substring(transform[i].indexOf('scale(') + 6);
                    } else if(transform[i].indexOf('translate(') !== -1) {
                        var currTranslate = transform[i].substring(transform[i].indexOf('translate(') + 10);
                        if(currTranslate.indexOf('\,') !== -1) {
                            currTranslate = currTranslate.split('\,');
                        } else {
                            currTranslate = currTranslate.split(' ');
                        }
                        translate[0] += parseFloat(currTranslate[0]) || 0;
                        translate[1] += parseFloat(currTranslate[1]) || 0;
                    }
                }
            }

            var width, height;
            var x, y;
            zoomG.each(function(d) {
                width = this.getBBox().width;
                height = this.getBBox().height;
                x = this.getBBox().x;
                y = this.getBBox().y;
            });
            return {translate: translate, scale: parseFloat(scale), width: width, height: height, x: x, y: y};
        },
        _getBBox: function (selection) {
            selection.each(function (d) {
                d.bbox = this.getBBox();
            })
        },
        _calculateEndpointPos: function (d, sourceMargin, targetMargin) {
            sourceMargin = sourceMargin || 0;
            targetMargin = targetMargin || 0;
            sourceMargin -= d.num * 3;
            targetMargin -= d.num * 3;
            var deltaX = d.target.x - d.source.x,
                deltaY = d.target.y - d.source.y,
                dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
                normX = deltaX / dist,
                normY = deltaY / dist,

                sourcePadding = this.options.nodeRadius[d.source.nodeType] + sourceMargin,
                targetPadding = this.options.nodeRadius[d.target.nodeType] + targetMargin,
                sourceX = d.source.x + sourcePadding * normX,
                sourceY = d.source.y + sourcePadding * normY,
                targetX = d.target.x - targetPadding * normX,
                targetY = d.target.y - targetPadding * normY;

            var angle = Math.atan(deltaY / deltaX),
                multiple = Math.ceil(d.num / 2);

            if(d.num % 2) {
                sourceX = sourceX - multiple * 12 * Math.sin(angle);  // 12 represents the distance between two parallel lines
                sourceY = sourceY + multiple * 12 * Math.cos(angle);
                targetX = targetX - multiple * 12 * Math.sin(angle);
                targetY = targetY + multiple * 12 * Math.cos(angle);
            } else {
                sourceX = sourceX + multiple * 12 * Math.sin(angle);
                sourceY = sourceY - multiple * 12 * Math.cos(angle);
                targetX = targetX + multiple * 12 * Math.sin(angle);
                targetY = targetY - multiple * 12 * Math.cos(angle);
            }
            return {sourceX: sourceX, sourceY: sourceY, targetX: targetX, targetY: targetY};
        },
        _splitText: function (text) {
            var arr = [];
            var line = 0;
            var numJson = {
                1: [1],
                2: [2],
                3: [3],
                4: [4],
                5: [2, 3],
                6: [3, 3],
                7: [3, 4],
                8: [4, 4],
                9: [4, 5],
                10: [3, 4, 3],
                11: [3, 5, 3],
                12: [4, 4, 4],
                13: [4, 5, 4],
                14: [4, 5, 6],
                15: [4, 5, 6]
            };
            if(text.length > 13) text = text.substring(0, 12) + '...';
            var textLength = text.length;
            line = numJson[textLength].length;
            if(line <= 1) {
                arr.push(text);
            } else if(line <= 2) {
                arr.push(text.substring(0, numJson[textLength][0]));
                arr.push(text.substring(numJson[textLength][0]));
            } else if(line <= 3) {
                arr.push(text.substring(0, numJson[textLength][0]));
                arr.push(text.substring(numJson[textLength][0], numJson[textLength][0] + numJson[textLength][1]));
                arr.push(text.substring(numJson[textLength][0] + numJson[textLength][1]));
            }
            //return {line: line, arr: arr};  // This is for Chinese words
            return {line: 1, arr: [text]}
        },
        _tick: function (link, linkText, node, pulseDot) {
            var _this = this;

            return function () {
                node.attr('transform', function (d) {
                    if(_this.options.fixNode && d.fixCount && _this.options.fixTotal <= 4) {
                        d.py = 1/2 * _this.h;
                        d.y = 1/2 * _this.h;
                        var rate = _this.options.splitAxiX[_this.options.fixTotal][d.fixCount - 1]
                        d.px = rate * _this.w;
                        d.x = rate * _this.w;

                    }
                    return "translate("+d.x+"," + d.y + ")";
                });
                link.attr('d', function (d) {
                    var posD = _this._calculateEndpointPos(d);
                    return 'M' + posD.sourceX + ',' + posD.sourceY + 'L' + posD.targetX + ',' + posD.targetY;
                });
                linkText.attr("transform", function (d) {
                    var posD = _this._calculateEndpointPos(d);
                    return "translate(" + (posD.targetX + posD.sourceX)/2 + "," + (posD.targetY + posD.sourceY)/2 + ")" + " rotate(" + Math.atan((d.target.y - d.source.y) / (d.target.x - d.source.x)) * 180 / Math.PI + ")";
                });
                if(pulseDot) {
                    pulseDot.attr('cx', function(d) {
                        return d.source.x;
                    }).attr('cy', function (d) {
                        return d.source.y;
                    });
                }

            }

        },
        _defineMaker: function (zoomG) {  // the style of arrow
            var _this = this;
            zoomG.append("defs").selectAll("marker")
                .data((function () {
                    var arr = [];
                    for(var key in _this.options.allRelationTypeMap) {
                        arr.push(_this.options.allRelationTypeMap[key].class);
                    }
                    return arr;
                })())
                .enter().append("marker")
                .attr("id", function(d) {
                    return d + '_maker';
                })
                .attr("viewBox", "0 -4 8 10")
                .attr("refX", 9)
                .attr("refY", 0)
                .attr("markerWidth", 5)
                .attr("markerHeight", 5)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M0,-4L10,0L0,4");
        },
        _defineGradient: function (zoomG) {  // the style of node
            var _this = this;
            var defs_gradient = zoomG.append('defs').selectAll('linearGradient')
                .data((function () {
                    var arr = [];
                    for(var key in _this.options.nodeTypeMap) {
                        arr.push(key);
                    }
                    return arr;
                })())
                .enter().append('linearGradient')
                .attr('id', function (d) {
                    return d + '_gradient';
                })
                .attr('x1', '0%')
                .attr('y1', '100%')
                .attr('x2', '100%')
                .attr('y2', '0%');
            defs_gradient.append('svg:stop')
                .attr('offset', '0%')
                .style('stop-color', function (d) {
                    return _this.options.nodeTypeMap[d][0];
                });
            defs_gradient.append('svg:stop')
                .attr('offset', '100%')
                .style('stop-color', function (d) {
                    return _this.options.nodeTypeMap[d][1];
                });
        },
        _zoom: function (zoomG) {
            var _this = this;
            var zoom = d3.behavior.zoom().scaleExtent([.6, 10]);
            zoom.on('zoom', function () {
                var currGetSize = _this._getSize(zoomG);
                if(d3.event.sourceEvent.type !== 'wheel' && d3.event.sourceEvent.type !== 'mousewheel') zoomG.attr("transform", "translate(" + currGetSize.width/2 + ", " + currGetSize.height/2 + ")translate(" + d3.event.translate + ")scale(" + currGetSize.scale + ")translate(-" + currGetSize.width/2 + ", -" + currGetSize.height/2 + ")");
            });
        },
        _pan: function (zoomG) {
            var _this = this;
            var svg_drag = d3.behavior.drag()
                .on('dragstart', function (d, i) {

                })
                .on('drag', function (d, i) {
                    var currGetSize = _this._getSize(zoomG);
                    zoomG.attr("transform", "translate(" + currGetSize.width/2 + ", " + currGetSize.height/2 + ")translate(" + (currGetSize.translate[0] + d3.event.dx) + ',' + (currGetSize.translate[1] + d3.event.dy) + ")scale(" + currGetSize.scale + ")translate(-" + currGetSize.width/2 + ", -" + currGetSize.height/2 + ")");
                })
                .on('dragend', function (d, i) {

                });
            return svg_drag;
        },
        _appendSvg: function () {
            var svg = d3.select('#' + this.wrapperId)
                .html('').append("svg")
                .attr('class', 'd3-container')
                .attr("width", this.w)
                .attr("height", this.h)
                .on('dblclick.zoom', null)
                .style("cursor","move");
            return svg;
        },
        _appendZoomG: function (svg) {
            return svg.append('g')
                .style('transform-origin', 'center');
        },
        _appendLink: function (zoomG) {
            var _this = this;
            //定义连线
            var link = zoomG.selectAll(".link")
                .data(this.data.links)
                .enter()
                .append("path")
                .attr("class", function (d) {
                    return "link " + d.relationType;
                })
                .attr("marker-end", function(d) { return "url(#" + d.relationType + "_maker)"; });

            return link;
        },
        _appendLinkText: function (zoomG) {
            var _this = this;
            var linkText = zoomG.selectAll('.linkText')
                .data(this.data.links)
                .enter().append("svg:g")
                .attr("class", "linkText");
            linkText.append("svg:text")
                //.attr("x", 8)
                .attr("y", ".31em")
                .attr('text-anchor', "middle")
                .text(function (d) {
                    return d[_this.options.lineTextField];
                })
                .call(this._getBBox);
            linkText.insert('rect', 'text')
                .attr('width', function(d) {
                    return d.bbox.width;
                })
                .attr('height', function (d) {
                    return d.bbox.height - 4;
                })
                .attr("y", "-.6em")
                .attr('x', function (d) {
                    return -d.bbox.width / 2;
                })
                .style('fill', '#fff');
            return linkText;
        },
        _appendNode: function (zoomG) {
            var _this = this;
            var node = zoomG.selectAll(".node")
                .data(this.data.nodes)
                .enter()
                .append("g")
                .on('mousedown', function () {
                    d3.event.stopPropagation();
                })
                .on('dblclick.zoom', function () {
                    d3.event.stopPropagation();
                });
            node.append("circle")
                .attr("r",function(d) {
                    return _this.options.nodeRadius[d.nodeType];
                })
                .attr('fill', function (d) {
                    return 'url(#' + d.nodeType + '_gradient)';
                });
            node.append('text')
                .attr('y', function(d) {
                    var lines = _this._splitText(d.name).line;
                    return -(lines * 9);
                })
                .style('alignment-baseline', 'middle')
                .selectAll('tspan')
                .data(function(d) {
                    return _this._splitText(d.name).arr;
                })
                .enter().append('tspan')
                .attr('x', 0)
                .attr("dy", "1.1em")
                .attr("class","nodeText")
                .style("text-anchor", "middle")
                .style('alignment-baseline', 'middle')
                .text(function(d, i) {
                    return d
                });
            return node;
        },
        _appendPulse: function (zoomG, pulseFlags) {
            var _this = this;
            var pulseDot = zoomG.selectAll('.pulseDot')
                .data(function() {
                    var arr = [];
                    $.each(_this.data.links, function (i, link) {
                        if(_this.options.allRelationTypeMap[link.relationTypeChinese].needPulse) {
                            arr.push(link);
                        }
                    });
                    return arr;
                })
                .enter().append('svg:circle')
                .attr('class', 'pulseDot')
                .attr('r', _this.options.nodeRadius.pulse)
                .style('fill', function (d, i) {
                    pulseFlags[i] = false;
                    return 'red';
                })
                .style('opacity', 0);
            return pulseDot;
        },
        _pulseHandle: function (pulseFlags, ele, r, delayTime) {
            var _this = this;
            var nodeRadius = _this.options.nodeRadius;
            var _ele = d3.select(ele);
            _ele
                .attr('r', r)
                .transition()
                .delay(function () {
                    return delayTime === undefined ? 250 : delayTime;
                })
                .duration(2000)
                .ease('linear')
                .each('start', function (d) {
                    var posD = _this._calculateEndpointPos(d, -2 * nodeRadius.pulse, -2 * nodeRadius.pulse);
                    _ele.attr('cx', posD.sourceX)
                        .attr('cy', posD.sourceY)
                        .style('opacity', 1);
                })
                .attr('cx', function (d) {
                    var posD = _this._calculateEndpointPos(d, -2 * nodeRadius.pulse, -2 * nodeRadius.pulse);
                    return (pulseFlags[d.source.index] || pulseFlags[d.target.index]) ? posD.targetX : posD.sourceX;
                })
                .attr('cy', function (d) {
                    var posD = _this._calculateEndpointPos(d, -2 * nodeRadius.pulse, -2 * nodeRadius.pulse);
                    return (pulseFlags[d.source.index] || pulseFlags[d.target.index]) ? posD.targetY : posD.sourceY;
                })
                .each('end', function(d) {
                    if(pulseFlags[d.source.index] || pulseFlags[d.target.index]) _this._pulseHandle(pulseFlags, ele, r, 30);
                });
        },
        _scaleAndRefresh: function (zoomG) {
            this.$wrapper.append('<div class="relation-operation" id="relation-operation-btns">' +
            '<i class="fa fa-search-plus relation-operation-item" aria-hidden="true" id="relation-plus">+</i>' +
            '<i class="fa fa-search-minus relation-operation-item" aria-hidden="true" id="relation-minus">-</i>' +
            '<i class="fa fa-refresh relation-operation-item" aria-hidden="true" id="relation-refresh">refresh</i>' +
            '</div>');

            var maxScale = 2,
                minScale = .8;
            var _this = this;
            $('#relation-plus').click(function () {
                var currGetSize = _this._getSize(zoomG);
                if(currGetSize.scale + 0.1 < maxScale) {
                    zoomG.attr("transform", "translate(" + currGetSize.width/2 + ", " + currGetSize.height/2 + ")translate(" + currGetSize.translate + ")scale(" + (currGetSize.scale + 0.1) + ")translate(-" + currGetSize.width/2 + ", -" + currGetSize.height/2 + ")");
                }
            });
            $('#relation-minus').click(function () {
                var currGetSize = _this._getSize(zoomG);
                console.log(currGetSize.scale)
                if(currGetSize.scale - 0.1 >= minScale) {
                    zoomG.attr("transform", "translate(" + currGetSize.width/2 + ", " + currGetSize.height/2 + ")translate(" + currGetSize.translate + ")scale(" + (currGetSize.scale - 0.1) + ")translate(-" + currGetSize.width/2 + ", -" + currGetSize.height/2 + ")");
                }
            });

            $('#relation-refresh').click(function () {
                _this.init();
            });

        },
        _filterAndLegend: function (zoomG, link, linkText, node, pulseDot) {
            var _this = this;
            if(_this.options.filter) {
                this.$wrapper.append('<ul class="relation-filter filter-container pull-right find-filter" id="relation-filter-wrapper"></ul>');
                d3.select('#relation-filter-wrapper')
                    .html('').selectAll("li")
                    .data((function() {
                        var arr = [];
                        for(var key in _this.options.allRelationTypeMap) {
                            if(_this.options.allRelationTypeMap[key].needShow) arr.push(key);
                        }
                        console.log(arr)
                        return arr;
                    })())
                    .enter()
                    .append("li")
                    .attr('class', 'filter-list')
                    .each(function (d) {
                        // create checkbox for each data
                        d3.select(this).append("span")
                            .attr("id", function (d) {
                                return "chk_" + _this.options.allRelationTypeMap[d].class;
                            })
                            .attr("class", function (d) {
                                return 'active filter-box chk_' + _this.options.allRelationTypeMap[d].class;
                            })
                            .on("click", function (d, i) {
                                // register on click event
                                var $this = $(this);
                                $this.toggleClass('active');
                                var lVisibility = $this.hasClass('active') ? "visible" : "hidden";
                                console.log(_this.options)
                                _this._filterGraph(_this.options.allRelationTypeMap[d].class, lVisibility, link, linkText, node, pulseDot);
                            })
                        d3.select(this).append("span")
                            .text(function (d) {
                                return d;
                            });
                    });
            }
            if(_this.options.legend) {
                this.$wrapper.append('<ul class="relation-legend legend-container pull-left find-legend" id="relation-legend-wrapper"></ul>');
                d3.select("#relation-legend-wrapper")
                    .html('').selectAll('li')
                    .data((function () {
                        var arr = [];
                        for(var key in _this.options.nodeTypeMap) {
                            arr.push(key);
                        }
                        return arr;
                    })())
                    .enter().append('li')
                    .attr('class', 'legend-list')
                    .each(function (d) {
                        var d3this = d3.select(this);
                        d3this.append('span')
                            .attr('class', function (d) {
                                return 'legend-circle leg_' + d;
                            });
                        d3this.append('span')
                            .text(function () {
                                return _this.options.nodeTypeMap[d][2];
                            });
                    })
            }
        },
        _filterGraph: function (aType, aVisibility, link, linkText, node, pulseDot) {
            // change the visibility of the connection path
            link.style("visibility", function (o) {
                var lOriginalVisibility = $(this).css("visibility");
                return o.relationType === aType ? aVisibility : lOriginalVisibility;
            });

            linkText.style("visibility", function (o) {
                var lOriginalVisibility = $(this).css("visibility");
                return o.relationType === aType ? aVisibility : lOriginalVisibility;
            });
            pulseDot.style("visibility", function (o) {
                var lOriginalVisibility = $(this).css("visibility");
                return o.relationType === aType ? aVisibility : lOriginalVisibility;
            });
            // change the visibility of the node
            // if all the links with that node are invisibile, the node should also be invisible
            // otherwise if any link related to that node is visibile, the node should be visible
            node.style("visibility", function (o, i) {
                var lHideNode = true;
                link.each(function (d, m) {
                    if (d.source === o || d.target === o) {
                        if ($(this).css("visibility") === "visible") {
                            lHideNode = false;
                            // we need show the text for this circle
                            return "visible";
                        }
                    }
                });
                if (lHideNode) {
                    // we need hide the text for this circle
                    return "hidden";
                }
            });
        },
        _drawRelation: function () {
            var _this = this;
            var force = this._initForce();
            var svg = this._appendSvg();
            var zoomG = this._appendZoomG(svg);

            this._defineMaker(zoomG);
            this._defineGradient(zoomG);
            this._scaleAndRefresh(zoomG);

            this._zoom(zoomG);
            svg.call(this._pan(zoomG));

            var link = this._appendLink(zoomG);
            var linkText = this._appendLinkText(zoomG);

            if(this.options.pulse) {
                var pulseFlags = [];
                var pulseDot = this._appendPulse(zoomG, pulseFlags);

                $(document).click(function (ev) {
                    pulseFlags = [];  // have canceled bubble of the nodes' click event
                    pulseDot.style('opacity', 0);
                });
            }
            var node = this._appendNode(zoomG);
            var tick = this._tick(link, linkText, node, pulseDot);

            this._filterAndLegend(zoomG, link, linkText, node, pulseDot);

            var isDraged,
                dx,
                dy;
            var node_drag = d3.behavior.drag()
                .on("dragstart", function(d, i) {
                    force.stop() // stops the force auto positioning before you start dragging
                    //pulseFlags[i] = false;
                    dx = d.x;
                    dy = d.y;
                })
                .on("drag", function(d, i) {
                    d.px += d3.event.dx;  //?
                    d.py += d3.event.dy; //?
                    d.x += d3.event.dx;
                    d.y += d3.event.dy;
                    tick(); // this is the key to make it work together with updating both px,py,x,y on d !
                    if(dx !== d.x || dy !== d.y) {
                        if(_this.options.pulse) {
                            pulseDot.style('opacity', 0);
                            pulseFlags[i] = false;
                        }
                        isDraged = true;
                    }
                })
                .on("dragend", function(d, i) {
                    d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
                    tick();
                    //force.resume();
                    if(_this.options.pulse) {
                        pulseDot.style('opacity', 0);
                        pulseFlags= [];
                    }
                    isDraged = (dx !== d.x || dy !== d.y);
                    if(_this.options.pulse) pulseFlags[i] = !isDraged;
                });


            node.call(node_drag);

            node
                .on('mouseover', function (d, i) {
                    link
                        .attr('class', function (item, i) {
                            if(item.source === d || item.target === d) {
                                return 'link ' + item.relationType + ' active';
                            } else {
                                return 'link ' + item.relationType + ' opacity';
                            }
                        });
                    linkText
                        .filter(function (item) {
                            return item.source !== d && item.target !== d;
                        })
                        .attr('class', function () {
                            return 'linkText opacity';
                        });
                    //pulseDot.style('opacity', 0);
                    node.attr('class', function (item) {
                        if(item === d || item.upstream.some(function(el) {return el == i}) || item.downstream.some(function(el) {return el == i})) {
                            return 'node ' + item.nodeType +' active';
                        } else {
                            return 'node ' + item.nodeType +' opacity';
                        }

                    })
                })
                .on('mouseout', function (d, i) {
                    link
                        .attr('class', function (item) {
                            return 'link ' + item.relationType;
                        });
                    linkText
                        .attr('class', function (item) {
                            return 'linkText';
                        });
                    node.attr('class', function (item) {
                        return 'node ' + d.nodeType;
                    })
                })
                .on('click', function(d, i) {
                    d3.event.stopPropagation();   // cancel bubble of the nodes' click event
                    if (isDraged) return;
                    _this.showNodeInfo(d);
                    if(!_this.options.pulse) return;
                    var pulseRadiusRange = [2, 6],
                        pulseRadiusJson = {},
                        pulseRadiusArr = [],
                        pulseFilterArr = [];
                    pulseDot.each(function(item) {
                        if(item.source === d || item.target === d) {
                            if(!pulseRadiusJson[item.amount]) {
                                pulseRadiusJson[item.amount] = item.amout;
                                pulseRadiusArr.push(item.amount);
                            }

                            pulseFilterArr.push(item);
                        }
                    });
                    pulseRadiusArr.sort();
                    var pulseRadiusStep = (pulseRadiusRange[1] - pulseRadiusRange[0]) / Math.min(40, pulseRadiusArr.length);

                    pulseDot.each(function (item) {
                        if(item.source == d || item.target == d) {
                            for(var i = 0; i < pulseRadiusArr.length; i++) {
                                if(pulseRadiusArr[i] === item.amount) {
                                    var r = Math.max(pulseRadiusRange[1] - (pulseRadiusArr.length - 1 - i) * pulseRadiusStep, pulseRadiusRange[0]);
                                    // TODO
                                    //_this._pulseHandle(pulseFlags, this, r);
                                    pulseHandle(this, r);

                                }
                            }
                        }
                    })
                });

            function pulseHandle(ele, r, delayTime) {
                var nodeRadius = _this.options.nodeRadius;
                var _ele = d3.select(ele);
                _ele
                    .attr('r', r)
                    .transition()
                    .delay(function () {
                        return delayTime === undefined ? 250 : delayTime;
                    })
                    .duration(2000)
                    .ease('linear')
                    .each('start', function (d) {
                        var posD = _this._calculateEndpointPos(d, -2 * nodeRadius.pulse, -2 * nodeRadius.pulse);
                        _ele.attr('cx', posD.sourceX)
                            .attr('cy', posD.sourceY)
                            .style('opacity', 1);
                    })
                    .attr('cx', function (d) {
                        var posD = _this._calculateEndpointPos(d, -2 * nodeRadius.pulse, -2 * nodeRadius.pulse);
                        return (pulseFlags[d.source.index] || pulseFlags[d.target.index]) ? posD.targetX : posD.sourceX;
                    })
                    .attr('cy', function (d) {
                        var posD = _this._calculateEndpointPos(d, -2 * nodeRadius.pulse, -2 * nodeRadius.pulse);
                        return (pulseFlags[d.source.index] || pulseFlags[d.target.index]) ? posD.targetY : posD.sourceY;
                    })
                    .each('end', function(d) {
                        if(pulseFlags[d.source.index] || pulseFlags[d.target.index]) pulseHandle(ele, r, 30);
                    });
            }

            force.on("tick", tick)
                .start();
        },
        init: function () {
            this._formatData();
            console.log(this.data);
            this._drawRelation();

        },
        showNodeInfo: function (node) {
            console.log(node.name);
        }
    }
})(window);