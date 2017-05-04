require(rvest)
require(stringr)
require(ggmap)
setwd("C:/Users/user/Dropbox/Penn/PhD/Spring_2017/Javascript/final")

get_state_parks <- function() {
  counter <- 1
  state_parks <- data.frame("")
  for (state_name in state.name) {
    print(paste(counter, state_name))
    state_link <- read_html(paste0("https://en.wikipedia.org/wiki/List_of_",
                                   state_name, "_state_parks"))
    i = 1
    repeat {
      state <- state_link %>%
        html_nodes(xpath = paste0('//*[@id="mw-content-text"]/table[', i, ']') ) %>%
        html_table(fill = TRUE, header = TRUE)
      state <- data.frame(state)
      state <- fix_parks_names(state)
      state <- data.frame(lapply(state, as.character), stringsAsFactors = FALSE)
      #    state <- relevant_columns(state)


      i <- i + 1
      if (is.data.frame(state) && nrow(state) > 7 && ncol(state) > 1) {
        state$state <- state_name
        state_parks <- dplyr::bind_rows(state_parks, state)
        break
      }
      if (i > 10) { break }
    }
    counter <- counter + 1
  }
  state_parks <- state_parks[-1,]
  rownames(state_parks) <- 1:nrow(state_parks)
  state_parks <- relevant_columns(state_parks)
  state_parks$type <- "State Park"
  return(state_parks)
}

fix_parks_names <- function(data.frame) {
  names(data.frame) <- tolower(names(data.frame))
  names(data.frame) <- gsub(".*name.*|^park$|state.park", "name",
                            names(data.frame))
  names(data.frame) <- gsub(".*county.*|.*location.*|.*counties.*|.*parish.*|.*close to.*",
                            "county",
                            names(data.frame))
  names(data.frame) <- gsub(".*status.*", "status", names(data.frame))
  names(data.frame) <- gsub(".*note.*|.*remark.*|.*descr.*|.*feature.*",
                            "notes", names(data.frame))
  names(data.frame) <- gsub(".*image.*|.*photo.*", "image", names(data.frame))
  names(data.frame) <- gsub(".*year.*|.*estab.*|.*found.*|.*date.*|.*created.*",
                            "established", names(data.frame))

  names(data.frame) <- gsub("^size$", "acres", names(data.frame))
  names(data.frame) <- gsub("^size.1$", "hectacres", names(data.frame))

  names(data.frame) <- gsub(".*visit.*", "visitors", names(data.frame))
  #
  #   names(data.frame) <-
  #     gsub("area.*[0-9]$|size.*[0-9]$|size.*[0-9]$|acre.*[0-9]$|.*km2.*",
  #                             "hectacres", names(data.frame))
  #  names(data.frame) <- gsub("area.*\\.$|size.*\\.$|acre.*\\.$",
  #                            "acres", names(data.frame))

  names(data.frame) <- gsub(".*meter.*|elevation.*[0-9]$",
                            "elevation_meters", names(data.frame))
  names(data.frame) <- gsub(".*feet.*|elevation.*\\.$",
                            "elevation_feet", names(data.frame))

  names(data.frame) <- gsub(".*river.*|.*water.*|.*lake.*",
                            "bodies_of_water", names(data.frame))

  return(data.frame)
}

relevant_columns <- function(data.frame) {
  data.frame <- data.frame[,
            !grepl(".*esta.*|.*water.*|.*lake.*|.*year.*|.*date.*|county.1",
                                    names(data.frame))]

  data.frame <- data.frame[, grep("name|county|state|note",
                                  names(data.frame))]
  return(data.frame)
}



only_first_county <- function(column) {
  column <- gsub("located between ", "", column, ignore.case = TRUE)
  column <- strsplit(column, ",| or | and | AND | OR |;")
  column <-  sapply(column, function (x) x[1])
  column <- gsub("\\[.*", "", column)
  column <- paste0(column, " county")
  column <- gsub(" county county", " county", column,
                 ignore.case = TRUE)
  column <- gsub(" {2,}", " ", column)
  column[column == "NA county"] <- ""

  return(column)
}

state_parks <- get_state_parks()
state_parks$county <- only_first_county(state_parks$county)


geocoder <- function(dataset, reverse = FALSE) {

  if (reverse == FALSE) {
    for (i in 1:nrow(dataset)) {
      if (suppressMessages(geocodeQueryCheck() > 0) && is.na(dataset$lon[i])) {
        geocoded <- ggmap::geocode(paste(dataset$name[i],
                                         dataset$single_county[i],
                                         dataset$state[i], sep = ", "))
        dataset$lon[i] <- geocoded$lon
        dataset$lat[i] <- geocoded$lat
      }
    }
  }

  if (reverse) {
    if (!"real_address" %in% names(dataset)) {
      dataset$real_address <- NA
    }
    for (i in 1:nrow(dataset)) {
      if (suppressMessages(geocodeQueryCheck() > 0) &&
          is.na(dataset$real_address[i]) && !is.na(dataset$lon[i])) {
        dataset$real_address[i] <-
              ggmap::revgeocode(as.numeric(c(parks_finished$lon[i],
                                             parks_finished$lat[i])))

      }
    }
  }

  return(dataset)
}
setwd("C:/Users/user/Dropbox/Penn/PhD/Spring_2017/Javascript/final")
load("parks_finished.rda")
parks_finished <- geocoder(parks_finished)
parks_finished <- geocoder(parks_finished, reverse = TRUE)
parks_finished$notes <- gsub("\\[.*", "", parks_finished$notes)

unique(parks_finished$type)
parks_finished$type[parks_finished$type == "National Monument"] <-
  "national_monument"
parks_finished$type[parks_finished$type == "National Park"] <-
  "national_park"
parks_finished$type[parks_finished$type == "National Forest"] <-
  "national_forest"
parks_finished$real_address <- as.character(parks_finished$real_address)

parks <- plyr::rbind.fill(geocoded_parks, parks)
parks_finished <- parks
save(parks_finished, file = "parks_finished.rda")
readr::write_csv(parks_finished, "parks_finished.csv")
