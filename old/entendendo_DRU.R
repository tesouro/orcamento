library(tidyverse)
library(readxl)

exec_rec_dru <- read_excel("./dados/exec_rec_dru.xlsx", skip = 8)

analise_rec <- exec_rec_dru %>%
  mutate(DRU = ifelse(Cod_Detalhe %in% c("980000", "980001"),
                      "DRU",
                      "Demais")) %>%
  group_by(Cod_Nat_Rec, Cod_Fonte, DRU) %>%
  summarise(Rec_Bruta = sum(Rec_Bruta))

# que fontes aparecem associadas com detalhamentos de DRU?
fontes_DRU <- analise_rec %>%
  filter(DRU == "DRU") %>%
  group_by(Cod_Fonte) %>%
  summarise(n())

# vou verificar se, para alguma combinação de natureza e fonte, existem simultaneamente detalhamentos de DRU e de não DRU
DRU_n_DRU <- analise_rec %>%
  group_by(Cod_Nat_Rec, Cod_Fonte) %>%
  summarise(qde = n()) %>% # contando quantas categorias de 
                           # detalhamentos -- DRU e não-DRU
                           # existem para cada Natureza-Fonte)
  filter(qde > 1)          # filtra os casos em que na mesma nat-fonte 
                           # existe DRU e não-DRU

lista_DRU <- analise_rec %>%
  ungroup() %>%
  filter(DRU == "DRU" & Cod_Fonte == "00") %>%
  select(nat_rec = Cod_Nat_Rec, fte = Cod_Fonte)

percent_DRU <- analise_rec %>%
  semi_join(lista_DRU) %>%
  spread(DRU, value = Rec_Bruta, fill = 0) %>%
  mutate(pct_DRU = DRU/(DRU+Demais)) %>%
  filter(pct_DRU > 0)

# write.csv2(percent_DRU, file = "percent_DRU.csv")



