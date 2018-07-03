# chunk "cores-e-fontes"

# DEFINIÇÕES DAS CORES

azul_STN <- "#004a93"
amarelo_STN <- "#ffd500"
amarelo_transluc <- "rgba(181,150,40,0.7)" # links receitas normais
verde_STN <- "#329c32"
cor_divida <- "#dd3127"
cor_divida_transluc <- "rgba(221, 49, 39,0.7)"
cor_divida_transluc2 <- "rgba(229, 90, 39,0.7)" # links outras receitas destinadas à dívida
cor_RGPS <- azul_STN
cor_RGPS_transluc <- "rgba(0,75,147,0.7)"
cor_RGPS_transluc2 <- "rgba(68,75,147,0.55)" # links outras receitas destinada ao RGPS
### obs: se o alpha for mui to baixo, o hover sobre o ramo/link fica imperceptível!

# CONSTRUÇÃO DO VETOR DE CORES DOS NOS
num_nos_rec <- length(unique(matriz$nr))
num_nos_des <- length(unique(matriz$nd))

cores_nos <- 1:num_nos
cores_nos[1:num_nos_rec] <- amarelo_STN
cores_nos[(num_nos_rec+1):(num_nos_rec+num_nos_des)] <- verde_STN

# destacar dívida

posicoes_divida <- c(
  which(unique(matriz$nr)=="Emissões de títulos"),    # esses rotulos poderiam estar parametrizados
  num_nos_rec+which(unique(matriz$nd)=="Amortização da Dívida"),
  num_nos_rec+which(unique(matriz$nd)=="Juros"))

cores_nos[posicoes_divida] <- cor_divida

# destacar previdência

posicoes_previdencia <- c(
  which(unique(matriz$nr)=="Contribuições e outras receitas do RGPS"),
  num_nos_rec+which(unique(matriz$nd)=="Benefícios Previdenciários RGPS"))

cores_nos[posicoes_previdencia] <- cor_RGPS

matriz$cores_ramos <- amarelo_transluc

for (i in 1:nrow(matriz)){
  if (matriz$nr[i] == "Emissões de títulos"){
    matriz$cores_ramos[i] <- cor_divida_transluc
  }
  else if (matriz$nr[i] == "Contribuições e outras receitas do RGPS"){
    matriz$cores_ramos[i] <- cor_RGPS_transluc
  }
  # acrescentando condições  
  else if (matriz$nd[i] == "Amortização da Dívida" | matriz$nd[i] == "Juros"){
    matriz$cores_ramos[i] <- cor_divida_transluc2
  }
  
  else if (matriz$nd[i] == "Benefícios Previdenciários RGPS"){
    matriz$cores_ramos[i] <- cor_RGPS_transluc2
  }
}