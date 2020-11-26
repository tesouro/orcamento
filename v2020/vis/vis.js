const vis = {

    refs: {

        svg: "svg.vis",
        cont: "div.vis-container",
        data: ["vis/links.csv", "vis/nodes.csv"]

    },

    sels: {

        svg : null,
        cont : null,
        axis : {}

    },

    elems: {

        svg:  null,
        cont: null

    },

    dims : {

        h: null,
        w: null,

        margins: {

            top: 10,
            left: 200,
            right: 10,
            bottom: 20

        }

    },

    data : {

        raw : null,
        graph : null,
        params : {
            x1_min : null,
            x0_max : null,
            y0_min : null,
            y1_max : null
        }

    },

    f : {

        // "administrative tasks"

        generates_refs: function() {

            vis.sels.svg  = d3.select(vis.refs.svg);
            vis.sels.cont = d3.select(vis.refs.cont);

            vis.elems.svg  = document.querySelector(vis.refs.svg);
            vis.elems.cont = document.querySelector(vis.refs.cont);

        },

        get_size: function() {

            let win_w = window.innerWidth;
            let win_h = window.innerHeight;

            let pos_vis_y = vis.elems.svg.getBoundingClientRect().y;

            vis.dims.h = win_h - pos_vis_y - vis.dims.margins.top - vis.dims.margins.bottom;
            // subtraio a margem para usar como margem
            vis.dims.w = win_w - vis.dims.margins.left - vis.dims.margins.right; //+vis.sels.svg.style("width").slice(0, -2);

        },

        set_size: function() {

            vis.elems.svg.style.setProperty(
                "height", vis.dims.h + "px");

            vis.elems.svg.style.setProperty(
                "width", vis.dims.w + "px");

            vis.elems.svg.style.setProperty("background-color", "coral");


        },

        read_data : function(url) {

            Promise.all([
                d3.csv(vis.refs.data[0]),
                d3.csv(vis.refs.data[1])
            ])

            .then(
                files => vis.control.begin(files)
            );

        },

        get_positions : function(nodes) {

            vis.data.posicoes = nodes.map((d,i) => ({

                rotulos : d.rotulos,
                ordem : d.y0,
                posicao : i,
                tipo : d.tipo,
                height : d.y1 - d.y0,
                width  : d.x1 - d.x0,
                y0 : d.y0,
                y1 : d.y1,
                x0 : d.x0,
                x1 : d.x1
            }));

            const nos_por_tipo = {

                receitas : vis.data.posicoes
                             .filter(d => d.tipo == "receita")
                             .sort((a, b) => b.y1 - a.y1),
                
                despesas : vis.data.posicoes
                             .filter(d => d.tipo == "despesa")
                             .sort((a, b) => b.y1 - a.y1)

            }

            console.log(nos_por_tipo["receitas"], nos_por_tipo.despesas);

            const max_y1 = d3.max(vis.data.posicoes, d => d.y1);

            vis.data.params.y1_max = max_y1;
            vis.data.params.x0_max = nos_por_tipo.despesas[0].x0;
            vis.data.params.x1_min = nos_por_tipo.receitas[0].x1;
            vis.data.params.y0_min = d3.min(vis.data.posicoes, d => d.y0);

            for (tipo of ["receitas", "despesas"]) {

                console.log(tipo)

                let y_atual = max_y1;

                nos_por_tipo[tipo].forEach((d,i) => {
    
                    y_atual -= d.height;
    
                    vis.data.graph.nodes[d.posicao].y0_ini = y_atual;
                    vis.data.graph.nodes[d.posicao].altura = d.height;
    
                });

            }

        }

    },

    draw : {

        graph : null,

        sankey : {
            
            setup : function(data) {

                console.log(data)

                const sankey = d3.sankey()
                .nodeId(d => d.rotulos)
                .nodeWidth(15)
                .nodePadding(10)
                .extent([
                    [vis.dims.margins.left, vis.dims.margins.top], 
                    [vis.dims.w - vis.dims.margins.right, vis.dims.h - vis.dims.margins.bottom]])
                ;

                vis.data.graph = sankey({
                        nodes: [...data.nodes],
                        links: [...data.links]
                });

            },

            create_elements : function() {

                // nodes

                vis.sels.svg.append("g")
                    .attr("stroke", "#000")
                    .selectAll("rect")
                    .data(vis.data.graph.nodes)
                    .join("rect")
                    .attr("x", d => d.x0)
                    .attr("y", d => d.y0)
                    .attr("height", d => d.y1 - d.y0)
                    .attr("width", d => d.x1 - d.x0)
                    .attr("fill", "blue")
                    .classed("hidden", true)
                    .classed("nodes", true)
                    .attr("data-tipo", d => d.tipo)
                    .append("title")
                    .text(d => d.rotulos)
                ;

                // links

                const link = vis.sels.svg.append("g")
                    .attr("fill", "none")
                    .attr("stroke-opacity", 0.5)
                    .selectAll("g")
                    .data(vis.data.graph.links)
                    .join("g")
                    .style("mix-blend-mode", "multiply")
                    .attr("data-source", d => d.source.rotulos)
                    .attr("data-target", d => d.target.rotulos)
                    .attr("data-value",  d => d.value)
                    .classed("links", true)
                    .classed("hidden", true)
                ;

                link.append("path")
                    .attr("d", d3.sankeyLinkHorizontal())
                    .attr("stroke", "#401F14")
                    .attr("stroke-width", d => Math.max(1, d.width))
                ;

            },

            show : function( elements, true_false ) {

                vis.sels.svg.selectAll("." + elements).classed("hidden", !true_false);

                if (elements == "links" & true_false) vis.draw.cortina.animate();

            }

        },

        cortina : {

            create : function() {

                vis.sels.svg
                  .append("rect")
                  .classed("cortina", true)
                  .attr("x", vis.data.params.x1_min)
                  .attr("y", vis.data.params.y0_min)
                  .attr("width", vis.data.params.x0_max - vis.data.params.x1_min)
                  .attr("height", vis.data.params.y1_max - vis.data.params.y0_min)
                  .attr("opacity", 1)
                  .attr("fill", "coral");

            },

            animate : function() {

                d3.select("rect.cortina")
                  .attr("opacity", 1)
                  .transition()
                  .duration(1000)
                  .attr("x", vis.data.params.x0_max)
                  .attr("width", 0);
            }



        },

        bar_chart : {

            move: function(option) {

                const prop = option == "initial" ?
                                       "y0_ini" :
                                       "y0";


                let rects = d3.selectAll("rect.nodes");

                rects
                  .transition()
                  .duration(1000)  
                  .attr("y", d => d[prop]);
            }


        }

                //"#da4f81"


    },

    control : {

        init : function() {

            vis.f.generates_refs();
            vis.f.get_size();
            vis.f.set_size();
            vis.f.read_data();
    
        },


        begin : function(files) {

            const links = files[0];
            const nodes = files[1];

            // saves data as a property to make it easier to access it elsewhere
            const data = {
                links : links,
                nodes : nodes
            };

            vis.data.raw = data;

            vis.draw.sankey.setup(data);
            vis.f.get_positions(vis.data.graph.nodes);
            vis.draw.sankey.create_elements();
            vis.draw.cortina.create();
            

            console.log(vis);

        }

    }

}

vis.control.init();