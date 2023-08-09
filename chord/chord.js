var width = 760,
    height = 820,
    outerRadius = Math.min(width, height) / 2 - 120,
    innerRadius = outerRadius - 10;

const data_dir = 'variable/'
var dataset = data_dir + "matrix_all.json";

var formatPercent = d3.format("%");
var numberWithCommas = d3.format("0,f");

var arc = d3.svg.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

var path = d3.svg.chord()
    .radius(innerRadius - 4);

function getDefaultLayout() {
    return d3.layout.chord()
    .padding(0.03)
    .sortSubgroups(d3.descending)
    .sortChords(d3.ascending);
}  
var last_layout;
var profs;
var g = d3.select("#chart_placeholder").append("svg")
        .attr("width", width)
        .attr("height", height)
    .append("g")
        .attr("id", "circle")
        .attr("transform", 
              "translate(" + width / 2 + "," + height / 2 + ")");
g.append("circle")
    .attr("r", outerRadius);


d3.csv(data_dir + "profcolor_complete.csv", function(error, profData) {

    if (error) {alert("Error reading file: ", error.statusText); return; }
    
    profs = profData; 
    updateChords(dataset); 
    
});
function updateChords( datasetURL ) {
    
    d3.json(datasetURL, function(error, matrix) {

    if (error) {alert("Error reading file: ", error.statusText); return; }
    
    layout = getDefaultLayout();
    layout.matrix(matrix);
 
    var groupG = g.selectAll("g.group")
        .data(layout.groups(), function (d) {
            return d.index; 
        });
    
    groupG.exit()
        .transition()
            .duration(1500)
            .attr("opacity", 0)
            .remove();
    
    var newGroups = groupG.enter().append("g")
        .attr("class", "group");
    newGroups.append("title");
    
    newGroups.append("path")
        .attr("id", function (d) {
            return "group" + d.index;
        })
        .style("fill", function (d) {
            return profs[d.index].color;
        });
    
    groupG.select("path") 
        .transition()
            .duration(1500)
        .attrTween("d", arcTween( last_layout ));
    newGroups.append("svg:text")
        .attr("xlink:href", function (d) {
            return "#group" + d.index;
        })
        .attr("dy", ".35em")
        .attr("color", "#fff")
        .text(function (d) {
            return profs[d.index].name; 
        });

    groupG.select("text")
        .transition()
            .duration(1500)
            .attr("transform", function(d) {
                d.angle = (d.startAngle + d.endAngle) / 2;
                
                return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")" +
                    " translate(" + (innerRadius + 26) + ")" + 
                    (d.angle > Math.PI ? " rotate(180)" : " rotate(0)"); 
            })
            .attr("text-anchor", function (d) {
                return d.angle > Math.PI ? "end" : "begin";
            });
    
    
    var chordPaths = g.selectAll("path.chord")
        .data(layout.chords(), chordKey );

    var newChords = chordPaths.enter()
        .append("path")
        .attr("class", "chord");
    
    chordPaths.exit().transition()
        .duration(1500)
        .attr("opacity", 0)
        .remove();

    chordPaths.transition()
        .duration(1500)
        .style("fill", function (d) {
            return profs[d.source.index].color;
        })
        .attrTween("d", chordTween(last_layout));
    groupG.on("mouseover", function(d) {
        chordPaths.classed("fade", function (p) {
            return ((p.source.index != d.index) && (p.target.index != d.index));
        });
    });
    
    last_layout = layout;
    
  });
}

function arcTween(oldLayout) {
    var oldGroups = {};
    if (oldLayout) {
        oldLayout.groups().forEach( function(groupData) {
            oldGroups[ groupData.index ] = groupData;
        });
    }
    
    return function (d, i) {
        var tween;
        var old = oldGroups[d.index];
        if (old) {
            tween = d3.interpolate(old, d);
        }
        else {
            var emptyArc = {startAngle:d.startAngle,
                            endAngle:d.startAngle};
            tween = d3.interpolate(emptyArc, d);
        }
        
        return function (t) {
            return arc( tween(t) );
        };
    };
}

function chordKey(data) {
    return (data.source.index < data.target.index) ?
        data.source.index  + "-" + data.target.index:
        data.target.index  + "-" + data.source.index;
}
function chordTween(oldLayout) {
    var oldChords = {};
    
    if (oldLayout) {
        oldLayout.chords().forEach( function(chordData) {
            oldChords[ chordKey(chordData) ] = chordData;
        });
    }
    
    return function (d, i) {
        var tween;
        var old = oldChords[ chordKey(d) ];
        if (old) {
            if (d.source.index != old.source.index ){
                old = {
                    source: old.target,
                    target: old.source
                };
            }
            
            tween = d3.interpolate(old, d);
        }
        else {        
            if (oldLayout) {
                var oldGroups = oldLayout.groups().filter(function(group) {
                        return ( (group.index == d.source.index) ||
                                 (group.index == d.target.index) )
                    });
                old = {source:oldGroups[0],
                           target:oldGroups[1] || oldGroups[0] };
                
                if (d.source.index != old.source.index ){
                    old = {
                        source: old.target,
                        target: old.source
                    };
                }
            }
            else old = d;        
            var emptyChord = {
                source: { startAngle: old.source.startAngle,
                         endAngle: old.source.startAngle},
                target: { startAngle: old.target.startAngle,
                         endAngle: old.target.startAngle}
            };
            tween = d3.interpolate( emptyChord, d );
        }

        return function (t) {
            return path(tween(t));
        };
    };
}


/* Activate the buttons and link to data sets */
d3.select("#matrix_all").on("click", function () {
    updateChords(data_dir + "matrix_all.json" );
});

d3.select("#matrix_pub").on("click", function() {
    updateChords(data_dir + "matrix_pub.json" );
});

d3.select("#matrix_proj").on("click", function() {
    updateChords(data_dir + "matrix_proj.json" );
});

d3.select("#matrix_events").on("click", function() {
    updateChords(data_dir + "matrix_events.json" );
});