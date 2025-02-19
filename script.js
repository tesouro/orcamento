const svg = document.querySelector('svg');
const svg_ = d3.select('svg');
const container = document.querySelector('.vis');
const container_ = d3.select('.vis');

let win_w = svg_.style("width").slice(0,-2); //window.innerWidth;


const H = 2000;
const W = win_w;
const W_cutoff = 500;

// ordenar

const DIMS = {

    PAD: 20,

    BAR_W: 20,

    MARGINS : {

        TOP: 10,
        LEFT: W < W_cutoff ? 120 : 200,
        RIGHT: W < W_cutoff  ? 120: 200,
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

function begin(file) {

    console.log(file);
    //const links = file.links//files[0];
    //const nodes = file.nodes//files[1];

    vis = new SankeyVis(file, svg_, container_);
    vis.plot();
    vis.interaction();

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
            .style("mix-blend-mode", "screen")
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

    }

    show_tooltip(e, d, self) {
    
        const rotulo = d.rotulos;
        const tipo = d.tipo;

        console.log(rotulo, tipo);

        const keyword = tipo == "receita" ? "source" : "target";
        const antikeyword = tipo == "receita" ? "target" : "source";

        const minidata = self.file[`cards_${keyword}s`].filter(d => d[keyword] == rotulo);

        console.log(minidata);


        const {x0, y0} = d;

        self.tooltip
            .style("transform", tipo == "despesa" ? `translate(${x0 + BAR_W}px, ${y0}px)` : `translate(calc(${x0}px - 100%), ${y0}px)`)
            .select("[data-info='nome']")
            .text(rotulo);

        const destino_origem = tipo == "receita" ? "destinações" : "origens";

        self.tooltip.selectAll(".tt-receita-ou-despesa").text(tipo);

        self.tooltip.selectAll(".tt-origens-ou-destinacoes").text(destino_origem);

        self.tooltip.select(".tt-percent-total").text(
            Utils.valor_percent(minidata[0].percent_do_total));

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

        this.links_elems
            .style("opacity", 0.1)

    }


    highlight_links(e, d, self) {

        const rotulo = d.rotulos;
        const tipo = d.tipo;

        console.log(rotulo, tipo);

        const keyword = tipo == "receita" ? "source" : "target";
        const antikeyword = tipo == "receita" ? "target" : "source";

        d3.selectAll(`.links[data-${keyword}='${rotulo}']`).style("opacity", 1);

        console.log(`.links[data-${keyword}='${rotulo}']`);

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

}


