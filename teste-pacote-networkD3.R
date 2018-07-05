# carregar os dados do "fluxo-rec-desp.Rmd" primeiro

install.packages("networkD3")
install.packages("igraph")
library(networkD3)

ramos <- data.frame(matriz$nos_rec, matriz$nos_desp, matriz$ramo)
colnames(ramos) <- c("source", "target", "value")

noss <- data.frame(rotulos)
colnames(noss) <- "name"

sankeyNetwork(Links = ramos, Nodes = noss, Source = 'source',
              Target = 'target', Value = 'value', NodeID = 'name',
              units = 'TWh', fontSize = 12, nodeWidth = 30)

ramos[,1:2] <- ramos[,1:2]-10

# exemplo do Marcos

Nodes <- read_excel('C:/Users/tiago.pereira/Downloads/Sankey.xlsx', sheet = "Nodes")
Links <- read_excel('C:/Users/tiago.pereira/Downloads/Sankey.xlsx', sheet = "Links")

Links[,1:2] <- Links[,1:2]-1

colnames(Links) <- c("source", "target", "value")
colnames(Nodes) <- "name"

sankeyNetwork(Links = Links, Nodes = Nodes, Source = 'source',
              Target = 'target', Value = 'value', NodeID = 'name',
              units = 'TWh', fontSize = 12, nodeWidth = 30)

lista_nos <- c(unique(Links$source),unique(Links$target))

qde_nos <- max(lista_nos)+1

sankeyNetwork(Links = Links, Nodes = Nodes[1:qde_nos,], Source = 'source',
              Target = 'target', Value = 'value', NodeID = 'name',
              units = 'TWh', fontSize = 12, nodeWidth = 30)
