const vis = {

    refs: {

        svg: "svg.vis",
        cont: "div.vis-container",
        steps: "ul.steps",
        data: ["vis/links.csv", "vis/nodes.csv"],
        nodes: "rect.nodes"

    },

    sels: {

        svg : null,
        cont : null,
        links : null

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
            left: 250,
            right: 250,
            bottom: 20

        },

        width_bars : 20

    },

    data : {

        raw : null,

        graph : null,

        box_interno : {
            x1_min : null,
            x0_max : null,
            y0_min : null,
            y1_max : null
        },

        params : {

            y_final : null,
            x_left  : null,
            x_right : null

        },

        totals : {
            receita : null,
            despesa : null
        },

        barras_iniciais : [

            {
                nome : "receita",
                tipo : "receita",
                texto: "Receitas",
                value : null,
                x    : null,
                y    : null,
                height : null,
                width  : null

            },

            {
                nome : "despesa",
                tipo : "despesa",
                texto: "Despesas",
                value : null,
                x    : null,
                y    : null,
                height : null,
                width  : null

            },

            {
                nome : "juros",
                tipo : "despesa",
                texto: "Juros",
                value : null,
                x    : null,
                y    : null,
                height : null,
                width  : null

            },

            {
                nome : "amortizacao",
                tipo : "despesa",
                texto: "Amortização da Dívida",
                value : null,
                x    : null,
                y    : null,
                height : null,
                width  : null

            },

            {
                nome : "emissao",
                tipo : "receita",
                texto: "Emissões de dívida",
                value : null,
                x    : null,
                y    : null,
                height : null,
                width  : null

            }


        ],

        rotulos_total_geral : {

            "receita" : {

                nome : "rec_total",
                texto : "Receita Total",
                tipo : "receita",
                ref_posicao : "emissao",
                top : null,
                left : null,
                value : null

            },

            "despesa" : {

                nome : "desp_total",
                texto : "Despesa Total",
                tipo : "despesa",
                ref_posicao : "emissao",
                top : null,
                left : null,
                value : null

            }

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

            let win_w = +vis.sels.cont.style("width").slice(0,-2); //window.innerWidth;
            let win_h = window.innerHeight; //+vis.sels.cont.style("height").slice(0,-2);

            let pos_vis_y = vis.elems.cont.getBoundingClientRect().y;

            vis.dims.h = win_h - pos_vis_y; //- pos_vis_y - vis.dims.margins.top - vis.dims.margins.bottom;
            // subtraio a margem para usar como margem
            vis.dims.w = win_w; // - vis.dims.margins.left - vis.dims.margins.right; //+vis.sels.svg.style("width").slice(0, -2);

        },

        set_size: function() {

            vis.elems.svg.style.setProperty(
                "height", vis.dims.h + "px");

            vis.elems.svg.style.setProperty(
                "width", vis.dims.w + "px");

            //vis.elems.svg.style.setProperty("background-color", "coral");


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

        get_nodes_positions : function(nodes) {

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
                x1 : d.x1,
                value : d.value
            }));

            const nos_por_tipo = {

                receita : vis.data.posicoes
                             .filter(d => d.tipo == "receita")
                             .sort((a, b) => b.y1 - a.y1),
                
                despesa : vis.data.posicoes
                             .filter(d => d.tipo == "despesa")
                             .sort((a, b) => b.y1 - a.y1)

            }

            console.log(nos_por_tipo["receita"], nos_por_tipo.despesa);

            const max_y1 = d3.max(vis.data.posicoes, d => d.y1);

            vis.data.box_interno.y1_max = max_y1;
            vis.data.box_interno.x0_max = nos_por_tipo.despesa[0].x0;
            vis.data.box_interno.x1_min = nos_por_tipo.receita[0].x1;
            vis.data.box_interno.y0_min = d3.min(vis.data.posicoes, d => d.y0);
            vis.data.params.x_left  = nos_por_tipo.receita[0].x0;
            vis.data.params.x_right = nos_por_tipo.despesa[0].x0;
            vis.data.params.y_final = max_y1;

            for (tipo of ["receita", "despesa"]) {

                console.log(tipo)

                let y_atual = max_y1;

                nos_por_tipo[tipo].forEach((d,i) => {
    
                    y_atual -= d.height;
    
                    vis.data.graph.nodes[d.posicao].y0_ini = y_atual;
                    vis.data.graph.nodes[d.posicao].altura = d.height;
    
                });

                // aproveita a carona para computar o valor total das receitas e despesas
                vis.data.totals[tipo] = d3.sum(nos_por_tipo[tipo], no => no.value);

            }

        },

        get_initial_bars_data : function() {

            // index das barras iniciais
            // faz uma tabelinha { nome : index }

            const nomes_indexes = {};
            
            vis.data.barras_iniciais.forEach( (d,i) => {
                nomes_indexes[d.nome] = i;
            });

            function get_node_data(node, nome) {

                const node_data = vis.data.graph.nodes.filter(d => d.rotulos == node)[0];
                const key = nomes_indexes[nome];

                console.log("Key:", key, "node", node_data, node_data.x0);

                vis.data.barras_iniciais[key].x = node_data.x0;
                vis.data.barras_iniciais[key].y = node_data.y0_ini;
                vis.data.barras_iniciais[key].width = node_data.x1 - node_data.x0;
                vis.data.barras_iniciais[key].height = node_data.y1 - node_data.y0;
                vis.data.barras_iniciais[key].value = node_data.value;
            }

            get_node_data("Juros", "juros");
            get_node_data("Emissões de Dívida", "emissao");
            get_node_data("Amortização da Dívida", "amortizacao");

            // essa foi a parte fácil, parametrizável. agora a parte feia.

            // receita antes da divida

            let receita = vis.data.barras_iniciais[ nomes_indexes["receita"] ];
            receita.x = vis.data.params.x_left;

            const y_final_emissoes =   vis.data.barras_iniciais[ nomes_indexes["emissao"] ].y 
                                     + vis.data.barras_iniciais[ nomes_indexes["emissao"] ].height;
            
            receita.y = y_final_emissoes;
            receita.height = vis.data.params.y_final - y_final_emissoes;
            receita.width = vis.dims.width_bars;
            receita.value = vis.data.totals.receita - vis.data.barras_iniciais[ nomes_indexes["emissao"] ].value;

            // despesa antes da divida

            let despesa = vis.data.barras_iniciais[ nomes_indexes["despesa"] ];
            despesa.x = vis.data.params.x_right;

            const y_final_juros =   vis.data.barras_iniciais[ nomes_indexes["juros"] ].y 
                                  + vis.data.barras_iniciais[ nomes_indexes["juros"] ].height;
            
            despesa.y = y_final_juros;
            despesa.height = vis.data.params.y_final - y_final_juros;
            despesa.width = vis.dims.width_bars;
            despesa.value = vis.data.totals.despesa - vis.data.barras_iniciais[ nomes_indexes["juros"] ].value - vis.data.barras_iniciais[ nomes_indexes["amortizacao"] ].value;

            // receita total (so rotulos)

            let rec_total = vis.data.rotulos_total_geral.receita;
            rec_total.top = vis.data.barras_iniciais[ nomes_indexes["emissao"] ].y;
            rec_total.left = vis.data.params.x_left + vis.dims.width_bars;
            rec_total.value = vis.data.totals.receita;

            // despesa total (so rotulos)

            let desp_total = vis.data.rotulos_total_geral.despesa;
            desp_total.top = vis.data.barras_iniciais[ nomes_indexes["emissao"] ].y;
            desp_total.left = vis.data.params.x_right;
            desp_total.value = vis.data.totals.despesa;

        }


    },

    draw : {

        graph : null,

        sankey : {
            
            setup : function(data) {

                console.log(data)

                const sankey = d3.sankey()
                .nodeId(d => d.rotulos)
                .nodeWidth(vis.dims.width_bars)
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
                    .classed("hidden", true)
                    .classed("nodes", true)
                    .attr("data-tipo", d => d.tipo)
                    .attr("data-id-node", d => d.rotulos)
                    .append("title")
                    .text(d => d.rotulos)
                ;

                // links

                vis.sels.links = vis.sels.svg.append("g")
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

                vis.sels.links.append("path")
                    .attr("d", d3.sankeyLinkHorizontal())
                    //.attr("stroke", "#401F14")
                    .attr("stroke-width", d => Math.max(1, d.width))
                ;

            },

            show : function( elements, true_false ) {

                // elements: links ou nodes

                vis.sels.svg.selectAll("." + elements).classed("hidden", !true_false);

                if (elements == "links" & true_false) vis.draw.cortina.animate();

            },

            rotulos : {

                create : function() {

                    vis.sels.rotulos_nodes = vis.sels.cont
                        .selectAll("div.rotulos-nodes")
                        .data(vis.data.graph.nodes)
                        .join("div")
                        .classed("rotulos", true)
                        .classed("rotulos-nodes", true)
                        .attr("data-id-rotulo-node", d => d.rotulos)
                        .attr("data-tipo-rotulo-totals", d => d.tipo)
                        .style("left", d => (d.tipo == "receita" ? d.x0 : d.x1) + "px")
                        .style("top", d => (d.y0 - 1) + "px")
                        .style("max-width", d => (d.tipo == "receita" ? vis.dims.margins.left : vis.dims.margins.right) + "px")
                        .style("opacity", 0)
                    ;

                    vis.sels.rotulos_nodes
                      .append("p")
                      .text(d => d.rotulos + ": R$ " + utils.valor_formatado(d.value))
                  ;

                },

                show : function(rotulo, opcao) {

                    let selection;

                    if (rotulo == "todos") {
                        selection = d3.selectAll("div.rotulos-nodes");
                    } else {
                        selection = d3.select("div[data-id-rotulo-node='" + rotulo + "']");
                    }

                    selection
                      .transition()
                      .duration(1000)
                      .style("opacity", opcao ? 1 : 0)
                    ;

                }



            }

        },

        cortina : {

            create : function() {

                vis.sels.svg
                  .append("rect")
                  .classed("cortina", true)
                  .attr("x", vis.data.box_interno.x1_min)
                  .attr("y", vis.data.box_interno.y0_min)
                  .attr("width", vis.data.box_interno.x0_max - vis.data.box_interno.x1_min)
                  .attr("height", vis.data.box_interno.y1_max - vis.data.box_interno.y0_min)
                  .attr("opacity", 0)
                  .attr("fill", "transparent");

            },

            animate : function() {

                d3.select("rect.cortina")
                  .attr("opacity", 1)
                  .transition()
                  .duration(2000)
                  .attr("x", vis.data.box_interno.x0_max)
                  .attr("width", 0);
            },

            reset : function() {

                d3.select("rect.cortina")
                  .attr("x", vis.data.box_interno.x1_min)
                  .attr("width", vis.data.box_interno.x0_max - vis.data.box_interno.x1_min)
                  .attr("opacity", 0)
                ;

            }



        },

        bar_chart : {

            totals : {

                create : function() {

                    vis.sels.totals = vis.sels.svg
                      .selectAll("rect.totals")
                      .data(vis.data.barras_iniciais)
                      .join("rect")
                      .classed("totals", true)
                      .classed("bordas", true)
                      .attr("data-id-barra-totals", d => d.nome)
                      .attr("data-tipo", d => d.tipo)
                      .attr("x", d => d.x)
                      .attr("y", d => d.y + d.height)
                      .attr("width", d => d.width)
                      .attr("height", 0)
                    ;

                },

                show : function(option) {

                    d3.selectAll("rect.totals").classed("hidden", !option);

                },

                show_borders : function(option) {

                    vis.sels.totals 
                      .classed("bordas", option);

                },

                animate : function(nome) {

                    d3.select('[data-id-barra-totals="' + nome + '"]')
                      .transition()
                      .duration(1000)
                      .attr("y", d => d.y)
                      .attr("height", d => d.height)
                    ;

                },

                rotulos : {

                    create : function() {


                        vis.sels.totals_rotulos = vis.sels.cont
                            .selectAll("div.rotulos-totals")
                            .data(vis.data.barras_iniciais)
                            .join("div")
                            .classed("rotulos", true)
                            .classed("rotulos-totals", true)
                            .classed("rotulos-totais-parciais", true)
                            .attr("data-id-rotulo-totals", d => d.nome)
                            .attr("data-tipo-rotulo-totals", d => d.tipo)
                            .style("left", d => (d.tipo == "receita" ? d.x : (d.x + d.width)) + "px")
                            .style("top", d => d.y + "px")
                            .style("max-width", d => (d.tipo == "receita" ? vis.dims.margins.left : vis.dims.margins.right) + "px")
                            .style("opacity", 0)
                        ;

                        vis.sels.totals_rotulos
                          .append("h3")
                          .text(d => d.texto)
                        ;

                        vis.sels.totals_rotulos
                          .append("p")
                          .text(d => utils.valor_formatado(d.value));
                        ;

                        // rotulos dos totais gerais

                        for (total of ["receita", "despesa"]) {

                            let info = vis.data.rotulos_total_geral[total];

                            let rotulo_total = vis.sels.cont
                              .append("div")
                              .classed("rotulos", true)
                              .classed("rotulos-totals", true)
                              .classed("rotulos-totais-gerais", true)
                              .attr("data-id-rotulo-totals", info.nome)
                              .attr("data-tipo-rotulo-totals", info.tipo)
                              .style("left", info.left + "px")
                              .style("top", info.top + "px")
                              .style("max-width", (info.tipo == "receita" ? vis.dims.margins.left : vis.dims.margins.right) + "px")
                              .style("opacity", 0)
                            ;

                            rotulo_total
                                .append("h3")
                                .text(d => info.texto)
                            ;
    
                            rotulo_total
                                .append("p")
                                .text(d => utils.valor_formatado(info.value));
                            ;

                        }


                    },

                    show : function(nome, opcao) {

                        let selection;

                        if (nome == "parciais") {
                            selection = d3.selectAll(".rotulos-totais-parciais");
                        } else if (nome == "gerais") {
                            selection = d3.selectAll(".rotulos-totais-gerais")
                        } else {
                            selection = d3.select('[data-id-rotulo-totals="' + nome + '"]');
                        }

                        console.log(selection);

                        selection
                          .transition()
                          .duration(1000)
                          .style("opacity", opcao ? 1 : 0)
                        ;
    
                    },

                }
            },

            move: function(option) {

                const prop = option == "initial" ?
                                       "y0_ini" :
                                       "y0";


                let rects = d3.selectAll("rect.nodes");

                rects
                  .transition()
                  .duration(2000)  
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

        activates_button : function(all_buttons, clicked) {

            let all_buttons_arr = Array.from(all_buttons);
            // pq o que vem é um HTML Collection

            all_buttons_arr.forEach(button => {
                button.classList.remove("selected");
            })

            clicked.classList.add("selected");    

        },

        monitora : {

            steps : function() {

                let steps = document.querySelector(vis.refs.steps);

                steps.addEventListener("click", function(e) {

                    //console.log(this.children, e.target, this.children[0] == e.target);
    
                    // to avoid de-selecting all buttons and running everything when user clicks outside the buttons

                    console.log(e.target);
    
                    if (e.target.matches("li[data-step]")) {
    
                        vis.control.activates_button(
                            all_buttons = this.children,
                            clicked = e.target
                        );
    
                        let step = e.target.dataset.step;

                        this.dataset.currentStep = step;

                        console.log("STEP: ", step);

                        vis.control.render_steps[step]();
    
    
                    } else {console.log("Clique num botão, meu filho.")}
    
                });

            },

            nodes : function() {

                vis.sels.nodes = d3.selectAll(vis.refs.nodes);

                vis.sels.nodes.on("click", function() {

                    let node_clicado = this.dataset.idNode;
                    let tipo_node_clicado = this.dataset.tipo;

                    console.log(this, node_clicado, tipo_node_clicado);

                    // rotulos

                    d3.selectAll("[data-id-rotulo-node]")
                      .style("opacity", "")
                      .classed("rotulo-de-node-selecionado", false)
                      .classed("rotulo-de-node-esmaecido", true)
                    ;

                    d3.selectAll("[data-id-rotulo-node='" + node_clicado + "']")
                      .style("opacity", "")
                      .classed("rotulo-de-node-selecionado", true)
                      .classed("rotulo-de-node-esmaecido", false)

                    // nodes

                    d3.selectAll("[data-id-node]")
                      .classed("node-selecionado", false)
                      .classed("node-esmaecido", true)
                    ;

                    d3.selectAll("[data-id-node='" + node_clicado + "']")
                      .classed("node-selecionado", true)
                      .classed("node-esmaecido", false)
                    ;

                    // links

                    const criterio = tipo_node_clicado == "receita" ? "source" : "target";

                    d3.selectAll(".links[data-" + criterio + "]")
                      .classed("node-selecionado", false)
                      .classed("node-esmaecido", true)
                    ;

                    console.log(".links[data-" + criterio + "='" + node_clicado + "']");
                    d3.selectAll(".links[data-" + criterio + "='" + node_clicado + "']")
                      .classed("node-selecionado", true)
                      .classed("node-esmaecido", false)
                    ;



                })



            }

        },

        render_steps : {

            "receitas" : function() {

                vis.draw.bar_chart.totals.animate("receita");
                vis.draw.bar_chart.totals.rotulos.show("receita", true);

            },

            "despesas" : function() {

                vis.draw.bar_chart.totals.animate("despesa");
                vis.draw.bar_chart.totals.rotulos.show("despesa", true);

            },

            "divida" : function() {

                vis.draw.bar_chart.totals.animate("juros");
                vis.draw.bar_chart.totals.rotulos.show("juros", true);

                window.setTimeout(
                    () => {
                        vis.draw.bar_chart.totals.animate("amortizacao");
                        vis.draw.bar_chart.totals.rotulos.show("amortizacao", true);
                    }, 
                    1000)
                ;

                window.setTimeout(
                    () => {
                        vis.draw.bar_chart.totals.rotulos.show("desp_total", true);
                    }, 
                    2000)
                ;
            },

            "necessidade" : function() {

                vis.draw.bar_chart.totals.animate("emissao");
                vis.draw.bar_chart.totals.rotulos.show("emissao", true);

                window.setTimeout(
                    () => {
                        vis.draw.bar_chart.totals.rotulos.show("rec_total", true);
                    }, 
                    1000)
                ;

                window.setTimeout(
                    () => {
                        vis.draw.bar_chart.totals.rotulos.show("parciais", false);
                        vis.draw.bar_chart.totals.show_borders(false);
                    }, 
                    3000)
                ;

            },

            "vinculacao" : function() {

                vis.draw.bar_chart.totals.show(false);
                vis.draw.bar_chart.totals.rotulos.show("gerais", false);
                vis.draw.sankey.show("nodes", true);
                vis.draw.bar_chart.move("sankey");

                window.setTimeout(
                    () => {
                        vis.draw.sankey.show("links", true)
                    }, 
                    2000
                );

                window.setTimeout(
                    () => {
                        vis.draw.sankey.rotulos.show("todos", true);
                    }, 
                    1000
                );

                    

            }




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

            // isolar o que define os tamanahos das coisas, para eventualmente por dentro do listener de resize

            vis.draw.sankey.setup(data);
            vis.f.get_nodes_positions(vis.data.graph.nodes);
            vis.f.get_initial_bars_data();
            vis.draw.sankey.create_elements();
            vis.draw.bar_chart.move("initial")
            vis.draw.cortina.create();
            vis.draw.sankey.rotulos.create();

            vis.draw.bar_chart.totals.create();
            vis.draw.bar_chart.totals.rotulos.create();

            vis.control.monitora.steps();
            vis.control.monitora.nodes();
            

            console.log(vis);

        }

    }

}

vis.control.init();