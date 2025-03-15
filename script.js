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
        console.log(width, height);
        
        const root = d3.hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);

        console.log(data, root)

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

class Abertura {

    constructor(canvas, data) {

        this.cv = document.querySelector(canvas);
        this.ctx = this.cv.getContext("2d");
        this.data = data;

        this.w = window.getComputedStyle(this.cv).width.slice(0,-2);
        this.h = window.getComputedStyle(this.cv).height.slice(0,-2);

        this.cv.width = this.w;
        this.cv.height = this.h;

        this.side = 10;
        this.gap = 1;

        this.ni = Math.floor(this.w / (this.side + this.gap));
        this.nj = Math.floor(this.h / (this.side + this.gap));  

        this.n = this.ni * this.nj;

    }

    plot() {

        for (let i = 0; i < this.ni; i++) {
            for (let j = 0; j < this.nj; j++) {

                const x = i * (this.side + this.gap);
                const y = j * (this.side + this.gap);

                //const idx = i + j * this.ni;

                //const value = this.data[idx];

                this.ctx.fillStyle = "tomato";
                this.ctx.fillRect(x, y, this.side, this.side);

            }
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

        console.log(obj_mult);

        for (let mult of obj_mult) {
            const val = value/mult.valor;
            if (val < 1000) return numero_br0.format(val) + " " + mult.sufixo;
        }

        return numero_br0.format(value/1e9) + " bi";

    }

}


