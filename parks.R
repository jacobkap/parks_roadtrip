require(rvest)
require(stringr)
require(rjson)

get_national_parks <- function() {

parks <- read_html(paste0("https://en.wikipedia.org/wiki/List_of_national",
                     "_parks_of_the_United_States"))
name <- parks %>%
  html_nodes(xpath = '//*[@id="mw-content-text"]/table[1]') %>%
  html_table()
names <- name[[1]][1]
names <- names$Name
names <- paste0(names, " National Park")

state <- name[[1]][3]
state <- gsub("([[:alpha:]]*)[[:digit:]].*", "\\1", state$Location)


image <- readLines(paste0("https://en.wikipedia.org/wiki/List_of_national",
                           "_parks_of_the_United_States"))
image <- image[grep("src", image, ignore.case = TRUE)]
image <- image[grep("jpg", image, ignore.case = TRUE)]
image <- gsub(".*(src=.*)srcset", "\\1", image)
image <- gsub("\\\"", "'", image)
image <- gsub(".*//(.*.jpg)' .*", "\\1", image, ignore.case = TRUE)
image <- image[3:length(image)]
image <- as.character(image)


popularity <- parks %>%
  html_nodes("td:nth-child(6)") %>%
  html_text()
popularity_number <- as.numeric(gsub(",", "", popularity))


description <- parks %>%
  html_nodes("td:nth-child(7)") %>%
  html_text()



parks <- data.frame(name = names, image = image, state = state,
                    popularity = popularity, popularity_num = popularity_number,
                    notes = description, type = "National Park")

return(parks)

}


get_national_forests <- function() {

  forests <- read_html(paste0("https://en.wikipedia.org/wiki/List_of_U.S._National",
                            "_Forests"))
  forest_table <- forests %>%
    html_nodes(xpath = '//*[@id="mw-content-text"]/table[1]') %>%
    html_table()

  name <- forest_table[[1]][1]$NameA
  name <- paste0(name, " National Forest")

  state <- forest_table[[1]]$Location
  state <- strsplit(state, "[0-9]|,")
  state <- sapply(state, "[", 1)

  notes <- forest_table[[1]]$DescriptionD

  forests <- data.frame(name = name, state = state, notes = notes, type = "National Forest")
  return(forests)
}

get_national_monuments <- function() {

  monuments <- read_html(paste0("https://en.wikipedia.org/wiki/List_of_National",
                              "_Monuments_of_the_United_States"))
  monuments_table <- monuments %>%
    html_nodes(xpath = '//*[@id="mw-content-text"]/table[3]') %>%
    html_table()

  state <- monuments_table[[1]]$Location
  state <- strsplit(state, "[0-9]|,")
  state <- sapply(state, "[", 1)

  name <- monuments_table[[1]]$`National Monument Name`
  name <- paste0(name, " National Monument")

  notes <- monuments_table[[1]]$Description

  monuments <- data.frame(name = name, state = state, notes = notes, type = "National Monument")
  return(monuments)
}


parks <- get_national_parks()
forests <- get_national_forests()
monuments <- get_national_monuments()
national <- plyr::rbind.fill(parks, forests, monuments)
write.csv(national, file = "national.csv")

convert_degrees <-function(x){
  z <- sapply((strsplit(x, "[?\\.]")), as.numeric)
  z[1, ] + z[2, ]/60
}


