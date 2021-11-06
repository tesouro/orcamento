
# qual o numero do no de juros
no_juros <- unique(matriz$nos_desp[which(matriz$nd=="Juros")])

# qual o numero do no de amortização da dívida
no_amort <- unique(matriz$nos_desp[which(matriz$nd=="Amortização da Dívida")])

matriz_semdivida <- matriz %>%
  mutate(nd = replace(nd, nd=="Juros", "Dívida"),
         nd = replace(nd, nd=="Amortização da Dívida", "Dívida"),
         nos_desp = replace(nos_desp, nd=="Dívida", min(no_juros,no_amort))) %>%
  filter(!(nr == "Emissões de títulos" & nd == "Dívida")) %>% # atenção a esse filtro!
  group_by(nr,nd,nos_rec,nos_desp,cores_ramos)%>%
  summarize(p = sum(p),
            ramo = sum(ramo))

# View(matriz_semdivida %>% filter(!(nr == "Emissões de títulos" & nd == "Dívida")))
# remover nó que sobrou do vetor de nos e do vetor de cores

rotulos_divida <- c(unique(matriz_semdivida$nr),unique(matriz_semdivida$nd))

# eliminar <- 1:num_nos
# eliminar[] <- TRUE
# eliminar[max(no_juros,no_amort)] <- FALSE # como substitui o nó de maior índice pelo número do nó de menor índice
# 
# rotulos_divida <- rotulos[eliminar]
# cores_nos_divida <- cores_nos[eliminar]
# 
# # renomear rotulo correspondente à dívida
# rotulos_divida[min(no_juros,no_amort)] <- "Dívida"

# plotar
library(plotly)
p(matriz_semdivida,rotulos_divida)

# 
# 
# p_sem_divida <- plot_ly(
#   type = "sankey",
#   orientation = "h",
#   opacity = 0.2,
#   
#   textfont = list(
#     family = "Roboto Condensed Light, Source Sans Pro, Arial Narrow",
#     color = "black"
#   ),
#   
#   node = list(
#     label = rotulos_divida,
#     color = cores_nos_divida,
#     pad = 10,
#     thickness = 25,
#     line = list(
#       color = "",
#       width = 0
#     )
#   ),
#   
#   hoverlabel = list(
#     font = list(
#       family = "Roboto Condensed Light, Source Sans Pro, Arial Narrow"
#     )
#   ),
#   
#   link = list(
#     source = matriz_semdivida$nos_rec,
#     target = matriz_semdivida$nos_desp,
#     value =  matriz_semdivida$ramo,
#     color = matriz_semdivida$cores_ramos
#     #color =  "rgba(255,213,0,0.4)" # o pulo do gato! para deixar a cor translucida, é preciso usar rgba, e o último
#     # parâmetro é a opacidade
#     
#     
#   )
# ) %>% 
#   layout(
#     title = "",
#     width = 700,
#     height = 800,
#     font = list(
#       family = "Roboto Condensed Light, Source Sans Pro, Arial Narrow",
#       size = 11,
#       color = "#004a93"
#     )
#   )
# 
# p_sem_divida
