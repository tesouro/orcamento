library(readxl)
library(tidyverse)


# 01a Importa Receitas do RGPS --------------------------------------------

rec_rgps_raw <- read_excel("v2020/dados/rec_rgps.xlsx", skip = 10)

colnames(rec_rgps_raw) <- c(
  "especie_cod", "especie",
  "desdobramento_cod", "desdobramento",
  "natureza_cod", "natureza",
  "fte_cod", "fte",
  "valor_rec"
)

rec_rgps <- rec_rgps_raw %>%
  mutate(receita = "RGPS")


# 01b Importa Demais Receitas ---------------------------------------------

rec_raw <- read_excel("v2020/dados/rec.xlsx", skip = 10)

colnames(rec_raw) <- c(
  "especie_cod", "especie",
  "desdobramento_cod", "desdobramento",
  "natureza_cod", "natureza",
  "fte_cod", "fte",
  "valor_rec"
)

# tab_rec <- rec_raw %>%
#   mutate(cod_esp = str_sub(natureza_cod, 1, 3),
#          nom_esp = especie) %>%
#   select(cod_esp, nom_esp) %>%
#   filter(str_sub(cod_esp, 1, 1) %in% c("1", "2")) %>%
#   distinct()


rec <- rec_raw %>%
  bind_rows(rec_rgps) %>%
  mutate(
    cod_esp  = str_sub(natureza_cod, 1, 3),
    cat      = str_sub(natureza_cod, 1, 1) %>% as.numeric(),
    comp_esp = str_sub(natureza_cod, 2, 3),
    
    cod_esp = ifelse(
      cat >= 7, 
      paste0(cat-6, comp_esp),
      cod_esp),
    
    receita = case_when(
      receita == "RGPS"                   ~ "Receitas do RGPS",
      cod_esp %in% c("211", "212")        ~ "Emissões de Dívida",
      cod_esp %in% c("132", "164", "230") ~ "Juros e remunerações recebidas",
      cod_esp == "111"                    ~ "Impostos",
      cod_esp %in% c("121", "122")        ~ "Contribuições sociais (exceto RGPS) e econômicas",
      cod_esp == "134"                    ~ "Exploração de Petróleo e outros recursos naturais",
      cod_esp %in% c("292", "293")        ~ "Outras receitas financeiras (Conta Única e Bacen)",
      TRUE                                ~ "Demais receitas"
    )
  )
  
rec %>% group_by(receita) %>% summarise(sum(valor_rec))

# 01c Importa Despesas ----------------------------------------------------

desp <- read_excel("v2020/dados/desp.xlsx", skip = 10)

colnames(desp) <- c(
  "fte_cod", "fte",
  "despesa",
  "valor_desp"
)

desp %>% group_by(despesa) %>% summarise(sum(valor_desp))

sum(rec$valor_rec) - sum(desp$valor_desp) # tem que dar zero, ou próximo

# 02 Preparação Matriz --------------------------------------------------

rec_dist <- rec %>%
  group_by(receita) %>%
  mutate(subtot_rec = sum(valor_rec),
         pct_rec_fte = valor_rec/sum(valor_rec)) %>%
  select(receita, fte, subtot_rec, pct_rec_fte)

desp_dist <- desp %>%
  group_by(fte) %>%
  mutate(pct_fte_des = valor_desp/sum(valor_desp)) %>%
  select(despesa, fte, pct_fte_des)

matriz_raw <- rec_dist %>%
  full_join(desp_dist, by = "fte")

matriz <- matriz_raw %>%
  mutate(pct_rec_desp = pct_rec_fte * pct_fte_des,
         valor_link   = subtot_rec * pct_rec_desp) %>%
  filter(!is.na(receita)) %>%
  group_by(receita, despesa) %>%
  summarise(pct_rec_desp = sum(pct_rec_desp),
            valor_link   = sum(valor_link))

# verifica
sum(matriz$valor_link, na.rm = T) - sum(rec$valor_rec) # tem que dar zero

# testes
matriz %>% filter(valor_link  >= 2.5e8) %>% nrow()
ggplot(matriz %>% filter(valor_link  <= 1e9)) + geom_histogram(aes(valor_link))

# filtra
matriz_reduz <- matriz %>% filter(
  valor_link >= 2.5e8
)

sum(matriz_reduz$valor_link, na.rm = T)- sum(rec$valor_rec)


# 03 Numeração dos nós ----------------------------------------------------

# relacao unica dos rotulos de receita e despesa:
rotulos <- c(unique(matriz_reduz$receita),unique(matriz_reduz$despesa))

# conta os nós e gera sequencia numerica a partir de zero
num_nodes <- length(rotulos)
nodes_vetor <- 0:(num_nodes - 1)

# cria tabelinha para numerar os nos
tab_nodes <- data.frame(nodes_vetor, 
                        rotulos)

# incorpora os números dos nodes na matriz, para a receita... e para a despesa.
matriz_nodes <- matriz_reduz %>%
  left_join(tab_nodes, by = c("receita" = "rotulos")) %>%   
  left_join(tab_nodes, by = c("despesa" = "rotulos"), suffix = c("_rec","_desp"))



# 04 Prepara dados para D3 ------------------------------------------------

links <- matriz_nodes %>%
  select(source = receita,
         target = despesa,
         value  = valor_link)

nodes <- tab_nodes
nodes$tipo <- c(
  rep("receita", length(unique(matriz_reduz$receita))),
  rep("despesa", length(unique(matriz_reduz$despesa)))
)

write.csv(links, "./v2020/vis/links.csv", fileEncoding = "utf8")
write.csv(nodes, "./v2020/vis/nodes.csv", fileEncoding = "utf8")

