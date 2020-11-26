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
  mutate(receita = "Receitas do RGPS")


# 01b Importa Demais Receitas ---------------------------------------------

rec_raw <- read_excel("v2020/dados/rec.xlsx", skip = 10)

colnames(rec_raw) <- c(
  "especie_cod", "especie",
  "desdobramento_cod", "desdobramento",
  "natureza_cod", "natureza",
  "fte_cod", "fte",
  "valor_rec"
)

tab_rec <- rec_raw %>%
  mutate(cod_esp = str_sub(natureza_cod, 1, 3),
         nom_esp = especie) %>%
  select(cod_esp, nom_esp) %>%
  filter(str_sub(cod_esp, 1, 1) %in% c("1", "2")) %>%
  distinct()


rec <- rec_raw %>%
  mutate(
    cod_esp  = str_sub(natureza_cod, 1, 3),
    cat      = str_sub(natureza_cod, 1, 1) %>% as.numeric(),
    comp_esp = str_sub(natureza_cod, 2, 3),
    
    cod_esp = ifelse(
      cat >= 7, 
      paste0(cat-6, comp_esp),
      cod_esp),
    
    receita = case_when(
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
