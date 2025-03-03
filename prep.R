library(readxl)
library(tidyverse)


# 01a Importa Receitas do RGPS --------------------------------------------

# rec_rgps_raw <- read_excel("./dados/rec_rgps.xlsx", skip = 10)
# 
# colnames(rec_rgps_raw) <- c(
#   "especie_cod", "especie",
#   "desdobramento_cod", "desdobramento",
#   "natureza_cod", "natureza",
#   "fte_cod", "fte",
#   "valor_rec"
# )
# 
# rec_rgps <- rec_rgps_raw %>%
#   mutate(receita = "RGPS")


# 01b Importa Demais Receitas ---------------------------------------------

rec_raw <- read_excel("./dados/rec.xlsx", skip = 10)

colnames(rec_raw) <- c(
  "categoria_cod", "categoria",
  "origem_cod", "origem",
  "especie_cod", "especie",
  "desdobramento_cod", "desdobramento",
  "fte_cod", "fte",
  "valor_rec"
)


rec <- rec_raw %>%
  #bind_rows(rec_rgps) %>%
  mutate(
    categoria_cod = case_when(
      categoria_cod == "7" ~ "1",
      categoria_cod == "8" ~ "2",
      TRUE ~ categoria_cod
    ),
    
    cod_esp  = paste0(categoria_cod, origem_cod, especie_cod),#str_sub(natureza_cod, 1, 3),
    cod_des  = paste0(cod_esp, desdobramento_cod),#str_sub(natureza_cod, 1, 1) %>% as.numeric(),

    # cod_esp = ifelse(
    #   cat >= 7, 
    #   paste0(cat-6, comp_esp),
    #   cod_esp),
    
    receita = case_when(
      cod_des == "1214"                   ~ "Receitas do RGPS",
      cod_esp %in% c("211", "212")        ~ "Emissões de Dívida",
      cod_esp %in% c("132", "164", "230") ~ "Juros e remunerações recebidas",
      cod_esp == "111"                    ~ "Impostos",
      cod_esp %in% c("121", "122")        ~ "Contribuições sociais (exceto RGPS) e econômicas",
      cod_esp == "134"                    ~ "Exploração de Petróleo e outros recursos naturais",
      cod_esp %in% c("292", "293")        ~ "Outras receitas financeiras",
      TRUE                                ~ "Demais receitas"
    )
  )
  
rec %>% group_by(receita) %>% summarise(sum(valor_rec))
rec %>% count(receita)

# 01c Importa Despesas ----------------------------------------------------

desp <- read_excel("./dados/desp.xlsx", skip = 10)

colnames(desp) <- c(
  "fte_cod", "fte",
  "despesa",
  "valor_desp"
)

desp %>% group_by(despesa) %>% summarise(sum(valor_desp))

sum(rec$valor_rec) - sum(desp$valor_desp) # tem que dar zero, ou próximo

# depois apagar isso
dif <- sum(rec$valor_rec) - sum(desp$valor_desp)
desp <- desp %>% mutate(
  valor_desp = ifelse(despesa == "Reserva de Contingência" & fte_cod == "000", valor_desp + dif, valor_desp)
)


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

#write.csv(links, "./vis/links.csv", fileEncoding = "utf8")
#write.csv(nodes, "./vis/nodes.csv", fileEncoding = "utf8")

total_links <- sum(links$value)

cards_sources <- links %>% 
  group_by(source) %>%
  mutate(
    subtotal_grupo = sum(value),
    percent_do_total = subtotal_grupo / total_links,
    percent_do_grupo = value / subtotal_grupo,
    rank = rank(-percent_do_grupo)
  ) %>%
  arrange(source, rank)

cards_targets <- links %>% 
  group_by(target) %>%
  mutate(
    subtotal_grupo = sum(value),
    percent_do_total = subtotal_grupo / total_links,
    percent_do_grupo = value / subtotal_grupo,
    rank = rank(-percent_do_grupo)
  ) %>%
  arrange(target, rank)


# dados para scroller da receita ------------------------------------------

rec_scroller <- rec %>%
  group_by(across(-c(especie, especie_cod, cod_esp, desdobramento_cod, desdobramento, cod_des, fte_cod, fte, valor_rec))) %>%
  summarise(valor_rec = sum(valor_rec)) %>%
  ungroup()

variaveis_de_interesse <- c("categoria_cod", "especie_cod", "origem_cod", "receita")

rec_stack <- rec_scroller

# for (var in variaveis_de_interesse) {
#   quo_var <- sym(var) # transforma "var", que é string, num símbolo
#   
#   rec_stack <- rec_stack %>%
#     #group_by(!! quo_var) %>%
#     mutate(!! paste0("pos_ini_", var) := cumsum(valor_rec) - valor_rec) #%>%
#     #ungroup()
# }

ordem_receitas <- c("Impostos", "Receitas do RGPS", "Contribuições sociais (exceto RGPS) e econômicas",  "Exploração de Petróleo e outros recursos naturais", "Juros e remunerações recebidas", "Emissões de Dívida", "Outras receitas financeiras", "Demais receitas")

rec_stack <- rec_stack %>%
  mutate(cod_orig = paste0(categoria_cod, origem_cod)) %>%
  mutate(valor_ac = cumsum(valor_rec) - valor_rec) %>%
  mutate(across(c(categoria_cod, cod_orig), 
                ~ match(.x, unique(.x)) - 1, .names = "gap_{.col}")) %>%
  mutate(gap_receita = match(receita, ordem_receitas) - 1)

ggplot(rec_stack) + geom_segment(aes(y = origem, yend = origem,
                                        x = valor_ac + gap_cod_orig * 1000, xend = valor_ac + gap_cod_orig * 1000 + valor_rec, color = categoria_cod)) +
  theme(legend.position = "none")

output <- list(
  links = links,
  nodes = nodes,
  cards_sources = cards_sources,
  cards_targets = cards_targets,
  rec_stack = rec_stack
)

jsonlite::write_json(output, "output.json")
