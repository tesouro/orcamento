const svg = document.querySelector('svg');
const svg_ = d3.select('svg');

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

const DATA = ["vis/links.csv", "vis/nodes.csv"];
let vis;

Promise.all([
    d3.csv(DATA[0]),
    d3.csv(DATA[1])
]).then(
    files => begin(files)
);

function begin(files) {

    const links = files[0];
    const nodes = files[1];

    vis = new SankeyVis(links, nodes, svg_);

}

class SankeyVis {

    data;
    svg;
    nodes_elems;
    links_elems;

    constructor(links, nodes, svg) {

        //this.links = links;
        //this.nodes = nodes;
        this.svg = svg;

        const sankey = d3.sankey()
            .nodeId(d => d.rotulos)
            .nodeWidth(BAR_W)
            .nodePadding(PAD)
            .extent([
                [DIMS.MARGINS.LEFT, DIMS.MARGINS.RIGHT], 
                [W - DIMS.MARGINS.RIGHT, H - DIMS.MARGINS.BOTTOM]])
        ;

        this.data = sankey({

            nodes: [...nodes],
            links: [...links]

        });

    }

    plot() {

        this.nodes_elems = this.svg.append("g")
            .attr("stroke", "#000")
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
            .append("title")
            .text(d => d.rotulos)
        ;

        // links

        this.links_elems = this.svg.append("g")
            .attr("fill", "none")
            .attr("stroke-opacity", 0.5)
            .selectAll("g")
            .data(this.data.links)
            .join("g")
            .style("mix-blend-mode", "multiply")
            .attr("data-source", d => d.source.rotulos)
            .attr("data-target", d => d.target.rotulos)
            .attr("data-value",  d => d.value)
            .classed("links", true)
        ;

        this.links_elems.append("path")
            .attr("d", d3.sankeyLinkHorizontal())
            //.attr("stroke", "#401F14")
            .attr("stroke-width", d => Math.max(1, d.width))
        ;

        this.links_elems.append("title")
            .text(d => `${d.source.rotulos} → ${d.target.rotulos}\n${Utils.valor_formatado(d.value)}`);

    }

}

class Utils {

    static valor_formatado(value) {

        return new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(
            value,
        )
        
    }

}


