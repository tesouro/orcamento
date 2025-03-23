const svg = document.querySelector('svg.sankey');
const svg_ = d3.select('svg.sankey');
const container = document.querySelector('.vis');
const container_ = d3.select('.vis');

let win_w = svg_.style("width").slice(0,-2); //window.innerWidth;


const H = 2000;
const W = win_w;
const W_cutoff = 600;

// ordenar

const DIMS = {

    PAD: 20,

    BAR_W: 20,

    MARGINS : {

        TOP: 10,
        LEFT: W < W_cutoff ? 100 : 180,
        RIGHT: W < W_cutoff  ? 100 : 180,
        BOTTOM: 20

    }
};

const PAD = 20;
const BAR_W = 20;

//const DATA = ["vis/links.csv", "vis/nodes.csv"];
const DATA = "output.json";
let vis;

//Promise.all([
    //d3.csv(DATA[0]),
    //d3.csv(DATA[1])
//])
d3.json(DATA)
   .then(
    file => begin(file)
);

let b;

function begin(file) {

    console.log(file);
    //const links = file.links//files[0];
    //const nodes = file.nodes//files[1];


    vis = new SankeyVis(file, svg_, container_);
    vis.plot();
    vis.interaction();

    // bubble chart

    b = new BubbleChart("svg.chart-metodologia", ".container-chart-metodologia", file.desp_fun);
    b.plot();

    const opening = new OpeningArt("svg.opening-art", b.subtotais);
    opening.plot();


    //const treemap = new TreeMapVis(file.nodes, ".treemap-opening");
    //treemap.plot();

    // tudo isso aqui para corrigir a curvatura do path
    const link = vis.data.links.filter(d => d.source.rotulos == "Emissões de Dívida" && d.target.rotulos == "Amortização da Dívida")[0];
    const node_emissoes = vis.data.nodes.filter(d => d.rotulos == "Emissões de Dívida")[0];
    const node_amortizacao = vis.data.nodes.filter(d => d.rotulos == "Amortização da Dívida")[0];

    const path_link_problematico = document.querySelector('[data-source="Emissões de Dívida"][data-target="Amortização da Dívida"] path ');

    path_link_problematico.setAttribute("d", `M${node_emissoes.x1},${link.y0} L${node_amortizacao.x0},${link.y1}`);

}

class SankeyVis {

    data;
    svg;
    nodes_elems;
    links_elems;
    labels_elems;

    tooltip;

    constructor(file, svg, visContainer) {

        const order = [
            "Impostos",
            "Receitas do RGPS",
            "Contribuições sociais (exceto RGPS) e econômicas",
            "Exploração de Petróleo e outros recursos naturais",
            "Juros e remunerações recebidas",
            "Outras receitas financeiras",
            "Demais receitas",
            "Pessoal Ativo",
            "Pessoal Inativo",
            "Benefícios Previdenciários RGPS",
            "Custeio Administrativo",
            "Custeio Social",
            "Custeio de Educação",
            "Custeio de Saúde",
            "Investimentos",
            "Outras transferências",
            "Reserva de Contingência",
            "Emissões de Dívida",
            "Juros",
            "Amortização da Dívida"
        ];

        //this.links = links;
        //this.nodes = nodes;
        this.svg = svg;
        this.visContainer = visContainer;

        const sankey = d3.sankey()
            .nodeId(d => d.rotulos)
            .nodeWidth(BAR_W)
            .nodePadding(PAD)
            .extent([
                [DIMS.MARGINS.LEFT, DIMS.MARGINS.RIGHT], 
                [W - DIMS.MARGINS.RIGHT, H - DIMS.MARGINS.BOTTOM]])
            .iterations(10)
            //
            // .nodeSort((a, b) => order.indexOf(a.rotulo) - order.indexOf(b.rotulo));
        ;

        const links = file.links;
        const nodes = file.nodes;
        this.file = file;

        this.data = sankey({

            nodes: [...nodes],
            links: [...links]

        });

    }

    plot() {

        const nodes_group = this.svg.append("g")
            .attr("stroke", "#000")
        ;

        this.nodes_elems = nodes_group
            .selectAll("rect")
            .data(this.data.nodes)
            .join("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => d.y1 - d.y0)
            .attr("width", d => d.x1 - d.x0)
            //.classed("hidden", true)
            .classed("nodes", true)
            .attr("data-tipo", d => d.tipo)
            .attr("data-id-node", d => d.rotulos)
        ;

        this.nodes_elems
            .append("title")
            .text(d => d.rotulos)
        ;


        // links

        const links_group = this.svg.append("g")
            .attr("fill", "none")
        ;

        this.links_elems = links_group
            .selectAll("g")
            .data(this.data.links)
            .join("g")
            //.style("mix-blend-mode", "multiply")
            .style("mix-blend-mode", "normal")
            .attr("data-source", d => d.source.rotulos)
            .attr("data-target", d => d.target.rotulos)
            .attr("data-value",  d => d.value)
            .classed("links", true)
        ;

        function tweenDash()  {
            const l = this.getTotalLength(),
                i = d3.interpolateString("0," + l, l + "," + l);
            return function(t) { return i(t) };
        }

        this.links_elems.append("path")
            .attr("d", d3.sankeyLinkHorizontal())
            //.attr("stroke", "#401F14")
            .attr("stroke-width", d => Math.max(1, d.width))
            .attr("stroke-opacity", d => d.value < 10e9 ? 0.3 : 0.6)
            //.attr("filter","url(#glow)")
            .transition()
            .duration(1000)
            .attrTween("stroke-dasharray", tweenDash)
        ;

        this.links_elems.append("title")
            .text(d => `${d.source.rotulos} → ${d.target.rotulos}\n${Utils.valor_formatado(d.value)}`)
        ;

        this.labels_elems = this.visContainer 
            .selectAll("p.labels")
            .data(this.data.nodes)
            .join("p")
            .style("left", d => d.x0 + 'px')
            .style("top", d => d.y0 + 'px')
            .style("transform", d => d.tipo == "receita" ? "translate(-100%, 0)" : `translate(${PAD}px, 0)`)
            .style("width", DIMS.MARGINS.RIGHT + 'px')
            .classed("labels", true)
            .classed("labels-receitas", d => d.tipo === "receita")
            .classed("labels-despesas", d => d.tipo === "despesa")
            .text(d => d.rotulos)
        ;

    }

    interaction() {

        this.tooltip = d3.select(".info-card");
        
        this.tooltip.style("width", DIMS.MARGINS.RIGHT + "px");

        this.nodes_elems.on("click", (e,d) => {

            this.show_tooltip(e, d, this);
            this.fade_all_links();
            this.highlight_links(e, d, this);
    
        })

        this.labels_elems.on("click", (e,d) => {

            this.show_tooltip(e, d, this);
            this.fade_all_links();
            this.highlight_links(e, d, this);
    
        })

        // fechar tooltip
        const btnFechar = document.querySelector('.btn-fechar');
        btnFechar.addEventListener("click", e => {
            this.tooltip.classed("info-card-hidden", true);
            this.show_all_links();
        })

    }

    show_tooltip(e, d, self) {
    
        const rotulo = d.rotulos;
        const tipo = d.tipo;

        //console.log(rotulo, tipo);

        const keyword = tipo == "receita" ? "source" : "target";
        const antikeyword = tipo == "receita" ? "target" : "source";

        const minidata = self.file[`cards_${keyword}s`].filter(d => d[keyword] == rotulo);

        //console.log(minidata);


        const {x0, y0} = d;

        self.tooltip
            .style("transform", tipo == "despesa" ? `translate(${x0 + BAR_W}px, ${y0}px)` : `translate(calc(${x0}px - 100%), ${y0}px)`)
            .classed("info-card-hidden", false)
            .attr("data-tipo-infocard", tipo)
            .select("[data-info='nome']")
            .text(rotulo);

        const destino_origem = tipo == "receita" ? "destinações" : "origens";

        // preenche campos
        self.tooltip.selectAll(".tt-receita-ou-despesa").text(tipo);
        self.tooltip.select("[data-tag]").attr("data-tag", tipo);

        self.tooltip.selectAll(".tt-origens-ou-destinacoes").text(destino_origem);

        self.tooltip.select(".tt-percent-total").text(
            Utils.valor_percent(minidata[0].percent_do_total));

        self.tooltip.select(".tt-valor-total").text(
            Utils.valor_reais(minidata[0].subtotal_grupo));

        // monta tabela com destinos ou origens
        const table = document.querySelector(".container-itens-detalhamento tbody");

        table.innerHTML = "";

        minidata.forEach(d => {

            const tr = document.createElement("tr");

            const td_nome = document.createElement("td");
            const td_valor = document.createElement("td");

            td_nome.classList.add("item-nome");
            td_valor.classList.add("item-valor");

            td_nome.textContent = d[antikeyword];
            td_valor.textContent = Utils.valor_percent(d.percent_do_grupo);

            tr.appendChild(td_nome);
            tr.appendChild(td_valor);

            table.appendChild(tr);

        });

    }

    fade_all_links() {

        d3.selectAll(".links")
            .style("opacity", 0.1)
            .classed("links-ativo", false) // isso serve para não usar o gradiente nas cores dos links
        ;

    }

    show_all_links() {

        d3.selectAll(".links")
            .style("opacity", 1)
            .classed("links-ativo", false) // isso serve para não usar o gradiente nas cores dos links
        ;
    }


    highlight_links(e, d, self) {

        const rotulo = d.rotulos;
        const tipo = d.tipo;

        const keyword = tipo == "receita" ? "source" : "target";
        const antikeyword = tipo == "receita" ? "target" : "source";

        d3.selectAll(`.links[data-${keyword}='${rotulo}']`).style("opacity", 1).classed("links-ativo", true);//.attr("stroke", "url(#strokeGradient)");

    }

}

class TreeMapVis {
    
    constructor(file, svg_ref) {

        this.file = file;
        this.svg_ref = svg_ref;
        this.data = file.filter(d => d.tipo == "despesa").map(d => {
            return ({
                "name": d.rotulos,
                "value": d.value
            })
        })

    }

    plot() {

        const data = {
            name: "Root",
            children: [...this.data]
        };

        const svg = d3.select(this.svg_ref);
        const width = +svg.style("width").slice(0,-2);
        const height = +svg.style("height").slice(0, -2);
        //console.log(width, height);
        
        const root = d3.hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);

        //console.log(data, root)

        const treemap = d3.treemap()
            .size([width, height])
            .padding(4)(root);

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const nodes = svg.selectAll("g")
            .data(root.leaves())
            .enter().append("g")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        nodes.append("rect")
            .attr("class", "node-treemap")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            //.attr("fill", "url(#imgPattern)");
            .attr("fill", (d, i) => color(i));

        nodes.append("text")
            .attr("x", d => (d.x1 - d.x0) / 2)
            .attr("y", d => (d.y1 - d.y0) / 2)
            .text(d => d.data.name);

        /*
        const treemap = d3.treemap()
            .tile(d3.treemapSquarify)
            .size([W, H])
            .paddingInner(1)
            .paddingOuter(1)
            .paddingTop(1)
            .paddingRight(1)
            .paddingBottom(1)
            .paddingLeft(1)
        ;

        const root = d3.hierarchy(this.file)
            .sum(d => d.value)
            .sort((a,b) => b.value - a.value)
        ;

        treemap(root);

        const cell = this.visContainer
            .selectAll("g")
            .data(root.leaves())
            .join("g")
            .attr("transform", d => `translate(${d.x0},${d.y0})`)
        ;

        cell.append("rect")
            .attr("fill", d => d.data.color)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
        ;

        cell.append("text")
            .attr("x", 3)
            .attr("y", 12)
            .text(d => d.data.name)
        ;
        */

    }
}

class BubbleChart {

    constructor(svg, cont, data) {

        this.data = data;
        this.svg = d3.select(svg);
        this.cont = d3.select(cont);

        this.buttons = d3.selectAll("[data-button]");
        this.buttons.on("click", e => this.button_click(e, this));

        this.W = +this.svg.style("width").slice(0,-2);
        this.H = +this.svg.style("height").slice(0,-2);

        this.margin = 0.05;

        const variables = ["desp", "gnd", "fun"];

        this.domains = {};
        this.subtotais = {};

        variables.forEach(variable => {

            this.domains[variable] = this.data.map(d => d[variable]).filter((v, i, a) => a.indexOf(v) === i);

            if (variable != "desp") {
                this.domains[variable].sort();
            }

            this.subtotais[variable] = [];

            this.domains[variable].forEach(categoria => {

                this.subtotais[variable].push(
                    {
                        nome : categoria,
                        valor : this.data.filter(d => d[variable] == categoria).reduce((acc, curr) => acc + curr.vlr, 0)
                    }
                );


            });

        });

        // POSITIONS!!!

        // Para achar o tamanho ideal do grid.

        const min_cell_size = 150; // chute

        this.grids = {

            "fun": { rows: 4, cols: 8 },
            "gnd": { rows: 3, cols: 3 },
            "desp": { rows: 3, cols: 4 }

        }

        let min_Height = this.H;

        // circulando pelas variaveis para ver a disposição e o tamanho necessário do grid para cada uma delas.

        // a ideia é: quero um grid que tenha uma célula de no mínimo 150 ("min_cell_size") pixels de largura
        // Se não couber, diminuo o número de colunas até que caiba.
        // Só que, aumentando o número de linhas, a altura do grid também aumenta, então atualize essa altura

        variables.forEach(variable => {

            let tentative_cols = this.grids[variable].cols;
            let tentative_grid_size = this.W * (1 - this.margin * 2) / tentative_cols;

            while (tentative_grid_size < min_cell_size) {

                tentative_cols -= 1;
                tentative_grid_size = this.W * (1 - this.margin * 2) / tentative_cols;

            }

            let tentative_rows = Math.ceil(this.domains[variable].length / tentative_cols);

            let tentative_Height = tentative_rows * tentative_grid_size + this.H * this.margin * 2;

            // atualiza o altura minima necessária para caber
            if (tentative_Height > min_Height) min_Height = tentative_Height;

            this.grids[variable].cols = tentative_cols;
            this.grids[variable].rows = tentative_rows;


        });

        //console.log(this.grids, min_Height);

        this.H = min_Height;

        this.svg.attr("viewBox", `0 0 ${this.W} ${this.H}`);
        this.svg.attr("height", this.H);
        this.svg.attr("width", this.W);
        this.svg.style("height", this.H + "px");


        this.positions = {}
        this.cell_sizes = {}

        // criar variaveis para as proporcoes, e so muda-las quando mudar o tamanho da tela

        //console.log("aqui");

        // circulando pelas variaveis para definir o grid

        variables.forEach(variable => {

            this.positions[variable] = [];

            let width = Math.floor(this.W * (1 - this.margin * 2) / this.grids[variable].cols);
            let height = Math.floor(this.H * (1 - this.margin * 2) / this.grids[variable].rows);

            this.cell_sizes[variable] = { width: width, height: height };

            for (let i = 0; i < this.domains[variable].length; i++) {

                this.positions[variable].push({
                    x : ( i % this.grids[variable].cols ) * width + this.W * this.margin + width * 0.5,
                    y : Math.floor(i / this.grids[variable].cols) * height + this.H * this.margin + height * 0.5
                });

            }


        });

    }

    plot_positions(variable, color) {

        this.svg.selectAll("rect").data(this.positions[variable]).join("rect")
            .attr("x", d => d.x - 5)
            .attr("y", d => d.y - 5)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", color)
        ;
    }

    plot() {

        this.scaleR = d3.scaleSqrt()
            .domain(d3.extent(this.data, d => d.vlr))
            .range([2, 60])
        ;

        this.scaleColor = d3.scaleOrdinal().domain(this.domains.gnd).range(["#ED90A4","#D3A263","#99B657","#33C192","#00BDCE","#94A9EC","#DC91DB"]);// d3.schemeCategory10);

        this.simulation = d3.forceSimulation(this.data)
            .force("charge", d3.forceManyBody().strength(5))
            .force("collision", d3.forceCollide().radius(d => this.scaleR(d.vlr) + 1))
            .on("tick", ticked);

        const nodes = this.svg.selectAll("circle")
            .data(this.data)
            .join("circle")
            .attr("r", d => this.scaleR(d.vlr))
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("fill", d => this.scaleColor(d.gnd))
        ;

        this.simulation.force("x", d3.forceX(this.W / 2).strength(0.05));
        this.simulation.force("y", d3.forceY(this.H / 2).strength(0.05));

        this.simulation.alpha(1).restart();

        function ticked() {
            nodes.attr("transform", d => `translate(${d.x},${d.y})`);
        }

        // hover nos bubbles

        nodes.on("mouseenter", (e,d) => {

            this.showtooltip(e, d, this);


        });

        nodes.on("mouseleave", (e,d) => {

            this.hidetooltip(e, d, this);


        });

        // rotulos do total. primeiro remover qualquer rotulo que já esteve presente.

        this.cont.selectAll("div.rotulo-cont-bubble").remove();

        const div = this.cont.append("div").classed("rotulo-cont-bubble", true).classed("rotulo-cont-bubble-total", true);
        
        div.append("p").classed("rotulo-bubble", true).classed("rotulo-total", true).text("Total");
        div.append("p").classed("rotulo-bubble", true).classed("valor-bubble", true).text("R$" + Utils.valor_reais(d3.sum(this.data, d => d.vlr)));



    }

    plot_classificacao(variavel) {

        this.simulation.force("x", d3.forceX(d => {

            // posicao do valor da variavel no dominio da variavel
            const idx = this.domains[variavel].indexOf(d[variavel]);
            
            // posicao da variavel no array de posicoes
            const pos = this.positions[variavel][idx];

            return pos.x;


        }).strength(0.07));

        this.simulation.force("y", d3.forceY(d => {

            // posicao do valor da variavel no dominio da variavel
            const idx = this.domains[variavel].indexOf(d[variavel]);

            // posicao da variavel no array de posicoes
            const pos = this.positions[variavel][idx];

            return pos.y;

        }).strength(0.07));

        this.simulation.alpha(1).restart();

        this.cont.selectAll("div.rotulo-cont-bubble").remove();
        
        this.cont.selectAll("div.rotulo-cont-bubble").data(this.subtotais[variavel]).join("div")
            .classed("rotulo-cont-bubble", true)
            .style("width", this.cell_sizes[variavel].width + "px")            
            .style("top", (d,i) => this.positions[variavel][i].y + this.cell_sizes[variavel].height/2 + "px")
            .style("left", (d,i) => this.positions[variavel][i].x + "px")
            .append("p")
            .classed("rotulo-bubble", true)
            .text(d => d.nome)
            .append("p")
            .classed("valor-bubble", true)
            .text(d => "R$" + Utils.valor_reais(d.valor));


    }

    button_click(e, self) {

        self.buttons.classed("selected", false);
        e.target.classList.add("selected");

        const variavel = e.target.dataset.button;

        if (variavel == "total") {

            self.plot();

        } else {

            self.plot_classificacao(variavel);
        }

    }

    showtooltip(e, d, self) {

        const tooltip = d3.select(".tooltip-bubble");

        //console.log(d);

        const w = +tooltip.style("width").slice(0,-2);
        const h = +tooltip.style("height").slice(0,-2);

        let dx = d.x + w > self.W ? -w -10 : 10;
        let dy = d.y + h > self.H ? -h -10 : 10;

        tooltip
            .style("transform", `translate(${d.x + dx}px, ${d.y + dy}px)`)
            .classed("hidden", false);

        const variables = ["desp", "gnd", "fun"];

        variables.forEach(variable => {

            tooltip.select(`.vlr-${variable}`).text(d[variable]);

        });

        tooltip.select(".vlr-vlr").text(Utils.valor_reais(d.vlr));

    }

    hidetooltip(e, d, self) {

        const tooltip = d3.select(".tooltip-bubble");


        tooltip
            .classed("hidden", true);
    }

}

class OpeningArt {

    constructor(svg, data) {

        this.svg = d3.select(svg);
        this.data = data;

        this.header = document.querySelector("header");

        const w_header = +window.getComputedStyle(this.header).width.slice(0,-2);
        const h_header = +window.getComputedStyle(this.header).height.slice(0,-2);

        const w_screen = window.innerWidth;
        const h_screen = window.innerHeight;

        this.w = w_header;
        this.h = h_screen - h_header;

        this.svg.attr("viewBox", `0 0 ${this.w} ${this.h}`);
        this.svg.style("height", this.h + "px");
        this.svg.style("width", this.w + "px");

        this.colors = ["dodgerblue", "khaki", "firebrick"];

    }

    plot() {

        let vertical = false;

        if (this.h > this.w) {

            vertical = true;

        }

        const variables = ["fun"];

        variables.forEach((variable, i) => {

            let xScale, yScale;
            
            if (vertical & variable == "fun") {

                yScale = d3.scaleBand()
                    .domain(this.data[variable].map(d => d.nome))
                    .range([0, this.h])
                    .padding(0.1)
                ;

                xScale = d3.linearScale()
                    .domain([0, d3.max(this.data[variable], d => d.valor)])
                    .range([0, this.w * 0.7])
            } else {

                xScale = d3.scaleBand()
                    .domain(this.data[variable].map(d => d.nome))
                    .range([0, this.w])
                    .padding(0.1)
                ;

                yScale = d3.scaleLinear()
                    .domain([0, d3.max(this.data[variable], d => d.valor)])
                    .range([0, this.h])

            }

            this.svg.selectAll("rect").data(this.data[variable]).join("rect")
                .attr("x", d => xScale(d.nome))
                .attr("y", yScale(0))
                .attr("width", xScale.bandwidth())
                .attr("height", 0)
                .attr("fill", this.colors[i])
                .transition()
                .delay(1000)
                .duration(1000)
                .attr("height", d => yScale(d.valor))


            ;

        });




    }



}

class Abertura {

    constructor(canvas, data) {

        this.cv = document.querySelector(canvas);
        this.ctx = this.cv.getContext("2d");
        this.data = data;

        this.w = window.getComputedStyle(this.cv).width.slice(0,-2);
        this.h = window.getComputedStyle(this.cv).height.slice(0,-2);

        this.cv.width = this.w;
        this.cv.height = this.h;

        this.side = 100;
        this.gap = 1;

        this.ni = Math.ceil(this.w / (this.side + this.gap));
        this.nj = Math.ceil(this.h / (this.side + this.gap));  

        this.n = this.ni * this.nj;

    }

    plot() {

        for (let k = 0; k < this.n; k++) {

            const j = k % this.nj;
            const i = Math.floor(k / this.nj);

            const sentido = i % 2 == 0 ? "crescente" : "decrescente";

            let x, y;

            if (sentido == "decrescente") {

                y = (this.nj - j - 1) * (this.side + this.gap);

            } else {

                y = j * (this.side + this.gap);

            }

            x = i * (this.side + this.gap);

            //const value = this.data[idx];

            this.ctx.fillStyle = "black";
            this.ctx.strokeStyle = "black";
            this.ctx.strokeRect(x, y, this.side, this.side);
            this.ctx.font = "16px Arial";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(k, x + this.side/2, y + this.side/2);

        }

    }

}

class Utils {

    static valor_formatado(value) {

        return new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(
            value,
        )
        
    }

    static valor_percent(value) {

        return new Intl.NumberFormat(
        'pt-BR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
            value,
        )
        
    }

    static valor_reais(value) {

        /* para formatar os numeros */
        const numero_br = new Intl.NumberFormat('pt-BR');
        const numero_br1 = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 1, minimumFractionDigits: 1});
        const numero_br0 = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 0, minimumFractionDigits: 0});

        const multiplos = [1, 1e3, 1e6, 1e9];//, 1e12];
        const sufixo    = ["", "mil", "mi", "bi"];//, "tri"];
        const obj_mult = multiplos.map((d,i) => ({
            valor: d,
            sufixo: sufixo[i]
        }));

        //console.log(obj_mult);

        for (let mult of obj_mult) {
            const val = value/mult.valor;
            if (val < 1000) return numero_br0.format(val) + " " + mult.sufixo;
        }

        return numero_br0.format(value/1e9) + " bi";

    }

}


