import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// O Leaflet acha os ícones padrão lendo a pasta deles pelo CSS e prefixa esse caminho
// nas URLs; no build do Vite os PNGs ganham hash e o caminho quebra. Com o prefixo
// vazio e as URLs importadas, qualquer L.marker sem ícone próprio continua aparecendo.
L.Icon.Default.imagePath = ''
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})
