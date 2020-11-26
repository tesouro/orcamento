const utils_consts = {

  localeBrasil : {
    "decimal": ",",
    "thousands": ".",
    "grouping": [3],
    "currency": ["R$", ""]
  },

  //https://cdn.jsdelivr.net/npm/d3-time-format@2/locale/pt-BR.json
  localeDataBrasil : {
    "dateTime": "%A, %e de %B de %Y. %X",
    "date": "%d/%m/%Y",
    "time": "%H:%M:%S",
    "periods": ["AM", "PM"],
    "days": ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"],
    "shortDays": ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
    "months": ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
    "shortMonths": ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  },

}

const utils = {

  localeBrasil : utils_consts.localeBrasil,
  localeDataBrasil : utils_consts.localeDataBrasil,

  formataBR   : d3.formatDefaultLocale(utils_consts.localeBrasil).format(",.0f"),
  formataBR_1 : d3.formatDefaultLocale(utils_consts.localeBrasil).format(",.1f"),
  formataPct  : d3.format(".0%"),

  valor_formatado : function(x) { 

    const multiplos = [1, 1e3, 1e6, 1e9, 1e12];
    const sufixo    = ["", "mil", "mi", "bi", "tri"];
    const obj_mult = multiplos.map((d,i) => ({
      valor: d,
      sufixo: sufixo[i]
    }));

    for (mult of obj_mult) {
      const val = x/mult.valor;
      if (val < 1000) return utils.formataBR_1(val) + " " + mult.sufixo;
    }
  },

  formataData : d3.timeFormat("%b %Y"),

  formataData_Anos : d3.timeFormat("%Y"),

  group_by_sum_d3 : function(objeto, coluna_categoria, coluna_valor, ordena_decrescente = false) {
    const resultado = []; 
    const categorias_unicas = d3.map(objeto, d => d[coluna_categoria]).keys();
    for (cat of categorias_unicas) {
      const subtotal_categoria = d3.sum(objeto.filter(d => d[coluna_categoria] === cat), d => +d[coluna_valor]);
      resultado.push({"categoria" : cat,
                      "subtotal"  : subtotal_categoria});   
    }
    if (ordena_decrescente) resultado.sort((a,b) => b.subtotal - a.subtotal);
    return resultado;
  },

  group_by_sum : function(objeto, coluna_categoria, coluna_valor, ordena_decrescente = false) {
    const resultado = []; 
    const categorias_unicas = objeto
                                .map(d => d[coluna_categoria])
                                .filter((v, i, a) => a.indexOf(v) === i);
    for (cat of categorias_unicas) {
      const soma = objeto
                      .filter(d => d[coluna_categoria] === cat)
                      .map(d => +d[coluna_valor])
                      .reduce((valor_acum, valor_atual) => valor_acum + valor_atual);
      resultado.push({"categoria" : cat,
                      "subtotal"  : soma});   
    }
    if (ordena_decrescente) resultado.sort((a,b) => b.subtotal - a.subtotal)
    return resultado;
  },

  unique : function(obj, col) {
    return obj
      .map(d => d[col])
      .filter((v, i, a) => a.indexOf(v) === i);
  },

  group_and_count : function(obj, col, percent = false) {
    let categories = utils.unique(obj, col);
  
    let divisor = percent ? obj.length : 1
  
    let result = categories.map(
      cat => ({
        "cat" : cat,
        "count": obj
          .filter(el => el[col] == cat)
          .length / divisor
      })
    );
  
    return result;
  },


  // para gerar arco para anotações

  gera_arco : function(x1,y1,x2,y2) {
    xmin = Math.min(x1,x2);
    xmax = Math.max(x1,x2);
    ymin = Math.min(y1,y2);
    xb = xmax - Math.abs(x2-x1)/6;
    yb = ymin + Math.abs(y2-y1)/6;
    path = "M" + x1 + "," + y1 + " Q" + xb + "," + yb + " " + x2 + "," + y2;
    //console.log(path)
    return path;
  },


  gera_grid : function(svg_ref, step) {
    const w = svg_ref.attr("width") | +svg_ref.style("width").slice(0,-2);
    const h = svg_ref.attr("height") | +svg_ref.style("height").slice(0,-2);
    console.log("svg dimensions", w, h);
  
    const grid_color = "limegreen";
    const vertical_color = "tomato";
    const horizontal_color = "dodgerblue";
  
    const selecao = svg_ref.append("g").classed("grid-help", true);

    for (let tick = 0; tick <= w; tick += step) {
      selecao.append("line")
        .attr("x1", tick)
        .attr("x2", tick)
        .attr("y1", 0)
        .attr("y2", h)
        .attr("stroke-width", 1)
        .attr("stroke", grid_color);
      selecao.append("text")
        .attr("x", tick)
        .attr("y", step)
        .text(tick)
        .attr("font-size", 8)
        .attr("font-weight", 100)
        .attr("fill", horizontal_color);
      selecao.append("text")
        .attr("x", tick)
        .attr("y", 2*step)
        .text(Math.round(100*tick/w, 0) + "w")
        .attr("font-size", 8)
        .attr("font-weight", 100)
        .attr("fill", horizontal_color);
    }
    for (let tick = 0; tick <= h; tick += step) {
      selecao.append("line")
        .attr("x1", 0)
        .attr("x2", w)
        .attr("y1", tick)
        .attr("y2", tick)
        .attr("stroke-width", 1)
        .attr("stroke", "lime");
      selecao.append("text")
        .attr("x", step)
        .attr("y", tick + 8)
        .text(tick)
        .attr("font-size", 8)
        .attr("text-anchor", "end")
        .attr("fill", vertical_color);
      selecao.append("text")
        .attr("x", step*2)
        .attr("y", tick + 8)
        .text(Math.round(100*tick/h, 0) + "h")
        .attr("font-size", 8)
        .attr("text-anchor", "end")
        .attr("fill", vertical_color);
    }
  },

  // função debounce para dar um atraso na chamada do resize
// https://davidwalsh.name/function-debounce
  debounce : function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  },

  init : function() {

    d3.timeFormatDefaultLocale(utils_consts.localeDataBrasil);

  }

}

utils.init();

/* ideia para filtrar valores de uma lista 

var arr = [{n: 1, p: "n"},{n: 2, p: "s"},{n: 3, p: "n"},{n: 4, p: "s"},{n: 4, p: "s"}],
    brr = [2,4],
    res = arr.filter(f => brr.includes(f.n));
console.log(res);

*/