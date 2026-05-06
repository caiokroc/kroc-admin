import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import * as XLSX from "xlsx";

/* ─── SUPABASE CONFIG ─── */
const SUPA_URL="https://ownpsdvraqcnufjftjvk.supabase.co";
const SUPA_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bnBzZHZyYXFjbnVmamZ0anZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNTM3MzksImV4cCI6MjA5MTkyOTczOX0.kjLaO6x6asikjeuDOnsfVvJmPAId0yAFyGbCmcL8GPQ";
const supa=async(path,opts={})=>{const r=await fetch(`${SUPA_URL}/rest/v1/${path}`,{headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":opts.prefer||"return=representation",...(opts.headers||{})},...opts});return r.json()};
const supaGet=(table,q="")=>supa(`${table}?${q}`);
const supaPost=(table,data)=>supa(table,{method:"POST",body:JSON.stringify(data)});
const supaPatch=(table,q,data)=>supa(`${table}?${q}`,{method:"PATCH",body:JSON.stringify(data)});
const supaDel=(table,q)=>supa(`${table}?${q}`,{method:"DELETE"});

/* KROC GRANOLA — SISTEMA DE GESTÃO v3 */

const USERS=[{email:"caio@krocgranola.com",senha:"kroc2025",nome:"Caio"},{email:"leo@krocgranola.com",senha:"kroc2025",nome:"Leo"},{email:"felipe@krocgranola.com",senha:"kroc2025",nome:"Felipe"}];

// URL do admin deployado — atualizar após o primeiro deploy
const ADMIN_URL = "https://kroc-admin.vercel.app";

const SITE_CFG={siteUrl:"https://kroc-granola.vercel.app",infinitipayHandle:"krocgranola",infinitipayFallbackUrl:"https://checkout.infinitepay.io/krocgranola/8mdvwLBpH",emailjsPublicKey:"EU94wFheUNx3IA5v-",sheetsSpreadsheetId:"11wQp3QNDbRV0hs4t12F3FYo2Q_0dJghfaZnHU6Rowqo",zapiInstance:"3F0D1912EB86230EF548A609893209A0",zapiToken:"B342684DF915A4F6BDA35E78",whatsappGroupPedidos:"120363410027685846-group",whatsappGroupEntregas:"120363407991521682-group",emailContato:"contato@krocgranola.com",pontoPartida:"Rua Ministro Godoi 679, Água Branca"};

const SHEETS_WRITE_URL="https://script.google.com/macros/s/AKfycbwa7eqnfuE9y2opPVSoCu3b60PpsEZaFTUK0IAATAtdvaRw4l_0TdOa--xrpSqVM_kj/exec";

const PRODUTOS=[
  {sku:"GRN-040",nome:"Granola Kroc 40g",tag:"40g",peso:40,custoEmb:2.02,preco:9.90,cor:"#F59E0B",bg:"#FEF3C7",tipo:"granola",qtdKey:"q40",pKey:"p40",dispKey:"disp40"},
  {sku:"GRN-240",nome:"Granola Kroc 240g",tag:"240g",peso:240,custoEmb:2.70,preco:44.90,cor:"#2563EB",bg:"#DBEAFE",tipo:"granola",qtdKey:"q240",pKey:"p240",dispKey:"disp240"},
  {sku:"GRN-500",nome:"Granola Kroc 500g",tag:"500g",peso:500,custoEmb:5.36,preco:84.90,cor:"#7C3AED",bg:"#F3E8FF",tipo:"granola",qtdKey:"q500",pKey:"p500",dispKey:"disp500"},
  {sku:"MEL-300",nome:"Mel Silvestre Puraflor 300g",tag:"Mel 300g",peso:300,custoEmb:0,preco:39.99,cor:"#CA8A04",bg:"#FEF9C3",tipo:"mel",qtdKey:"qMel",pKey:"pMel",dispKey:"dispMel"},
];

const INIT_ING=[
  {nome:"Castanha de Caju",prop:0.192,precoKg:50.50,comprado:15.81},
  {nome:"Coco Chips",prop:0.192,precoKg:87.10,comprado:15.81},
  {nome:"Amêndoa Laminada",prop:0.192,precoKg:89.50,comprado:15.81},
  {nome:"Semente Abóbora",prop:0.183,precoKg:51.00,comprado:13.48},
  {nome:"Semente Girassol",prop:0.134,precoKg:22.58,comprado:14.04},
  {nome:"Mel",prop:0.107,precoKg:20.00,comprado:20.00},
];

const INIT_LOTES=[
  {id:"L001",kg:4,data:"2026-03-21",p40:100,p240:0,p500:0},
  {id:"L002",kg:8.44,data:"2026-03-28",p40:0,p240:6,p500:14},
  {id:"L003",kg:11.44,data:"2026-03-29",p40:0,p240:6,p500:20},
  {id:"L004",kg:5.9,data:"2026-03-30",p40:0,p240:10,p500:7},
  {id:"L005",kg:4.72,data:"2026-04-08",p40:0,p240:3,p500:8},
  {id:"L006",kg:8.88,data:"2026-04-10",p40:0,p240:6,p500:11},
];

const INIT_EMB=[
  {nome:"Adesivo 500g",comprado:156,usado:60},{nome:"Adesivo 240g",comprado:218,usado:31},{nome:"Adesivo 40g",comprado:100,usado:100},
  {nome:"Pacote 500g",comprado:156,usado:60},{nome:"Pacote 240g",comprado:218,usado:31},{nome:"Pacote 40g",comprado:100,usado:100},
  {nome:"Sacola Entrega",comprado:80,usado:47},
];

// ─── TODAS AS 48 VENDAS REAIS DA PLANILHA ───
// ─── ENDEREÇOS DOS CLIENTES (da planilha Clientes) ───
const ADDR={
"Tiago Liberman":{tel:"+55 11 99765-0045",rua:"Rua tupi 819",comp:"Apto 141"},
"Ana Carina Homa":{tel:"+55 11 94954-2000",rua:"Rua Dos Escultores 285",comp:"Casa"},
"Marcos Bodin":{tel:"+55 21 98104-3303",rua:"Rua Dos Escultores 285",comp:"Casa"},
"Eduardo Cardillo":{tel:"+55 11 99950-7002",rua:"Rua Morgado de Mateus 259",comp:"Apto 152"},
"Mari Garcia":{tel:"+55 11 95042-2828",rua:"Rua Cel irlandino sandoval 138",comp:"Casa"},
"Monika Cerqueira":{tel:"+55 11 98473-9737",rua:"Rua Bela Cintra 2206",comp:"Apto 72"},
"Stephanie C. Erxleben":{tel:"+55 11 97568-8526",rua:"Rua Gabrielle D Annuzio 1400",comp:"Apto 9V"},
"Miguel Toni":{tel:"+55 11 99992-5284",rua:"Rua Ministro Godoi 679",comp:"Apto 161"},
"Elizabeth Logrado":{tel:"+55 11 96594-3787",rua:"Rua Aratãs 298",comp:"Apto 22"},
"Ana Lucia Adorno":{tel:"+55 11 99983-8335",rua:"Rua Paulo Franco 142",comp:"Apto 173"},
"Pedro Wagner":{tel:"+55 11 97169-1211",rua:"Rua doutor emilio ribas 70",comp:"Apto 70"},
"Vitor Gazel":{tel:"+55 11 99912-9593",rua:"Rua da Consolação 3701",comp:"Apto 81"},
"Francisco Cardia":{tel:"+55 11 97224-8188",rua:"Rua Urussui 333",comp:"Apto 34"},
"Thomas Bortman":{tel:"+55 11 97682-5069",rua:"Rua Itapicuru 801",comp:"Apto 31"},
"Victor Hugo":{tel:"+55 71 8810-8800",rua:"Rua Osório duque estrada 40",comp:"Apto 401"},
"Ana Maria Pupo":{tel:"+55 11 99200-0261",rua:"Rua Ministro Godoi 679",comp:"Apto 71"},
"João Lindenberg":{tel:"+55 92 98635-4277",rua:"Rua Rio Grande 205",comp:"Apto 22"},
"Caco Alzugaray":{tel:"+55 11 98883-8383",rua:"Rua Murupi 253",comp:"Casa"},
"Maria Giulia Uliana":{tel:"+55 11 99909-1377",rua:"Rua barata ribeiro 336",comp:"Apto 75"},
"Guilherme Vidigal":{tel:"+55 11 99931-3555",rua:"Rua Dom Paulo Pedrosa, 457",comp:"Apto 22 A"},
"Ignacio Bastias Jiron":{tel:"+55 11 94764-2072",rua:"Rua Padre Carvalho 86",comp:"Apto 81"},
"Mariana Americano":{tel:"+55 11 98844-0834",rua:"Rua Cel irlandino sandoval 138",comp:"Casa"},
"Noemi Perdigão":{tel:"+55 41 99236-8646",rua:"Rua Mourato Coelho, 250",comp:"Apto 202b"},
"Caio de Souza Moraes":{tel:"+55 21 99911-4189",rua:"Rua paulistania 130",comp:"Apto 503 R"},
"Monica Queiroz":{tel:"+55 11 99142-8812",rua:"Rua Jorge Americano 472",comp:"Apto 11"},
"Katia Negreiros":{tel:"+55 11 99438-4452",rua:"Rua dos escultores 597",comp:"Apto 12"},
"Fernando Musolino":{tel:"+55 11 99964-6105",rua:"Rua Ubiracica 567",comp:"Casa"},
"Cristiane Hong":{tel:"+55 11 97389-5097",rua:"Rua Aimbere 607",comp:"Apto 22"},
"Paula da Rosa Padilha":{tel:"+55 11 99420-2974",rua:"Rua Dr. José Elias, 227",comp:"Apto 42B"},
"Simone Castro":{tel:"+55 11 98275-0099",rua:"Rua Oscar Freire 264",comp:"Apto 17"},
"Raymundo":{tel:"+55 11 96611-7887",rua:"Av Bagiru 100",comp:"Casa"},
"TRACK AND FIELD":{tel:"-",rua:"Rua Eduardo Souza Aranha 387",comp:"3º Andar"},
"Ariane Ferreira":{tel:"+55 12 97401-3797",rua:"Rua Dos Escultores 285",comp:"Casa"},
"Nathalia Lellis":{tel:"+55 21 99581-3461",rua:"Rua Dos Escultores 285",comp:"Casa"},
"Alexandra Bacco":{tel:"+55 11 95444-5001",rua:"Rua Dos Escultores 285",comp:"Casa"},
"Lígia Reis de Queiroz":{tel:"+55 11 99982-6749",rua:"Rua desembargador ferreira França 40",comp:"Apto 152 C"},
"Raphael Cortez":{tel:"+55 11 99730-1002",rua:"Rua Manuel Pereira Guimarães, 398",comp:"Casa"},
"André Franch":{tel:"+55 11 99828-5053",rua:"Rua Jesuíno arruda 60",comp:"Apto 131"},
"Felipe Pettenatti":{tel:"+55 11 99281-3354",rua:"Rua Jorge Americano 472",comp:"Apto 32"},
"Lucas Kim":{tel:"+55 11 95722-6565",rua:"Rua Alameda Jaú 759",comp:"Apto 81"},
"Mari Fontes":{tel:"-",rua:"PRESENCIAL",comp:"-"},
"Fernanda Xena":{tel:"-",rua:"PRESENCIAL",comp:"-"},
"Fernanda Medeiros":{tel:"+55 11 99232-1271",rua:"Rua José Maria Lisboa, 1370",comp:"Apto 21"},
"Lucimara Melhado":{tel:"",rua:"Rua Tomé de Souza 1207",comp:"Casa"},
};
const ga=n=>ADDR[n]||{tel:"",rua:"",comp:""};

// ─── VENDAS: fonte de verdade = Google Sheets "Pedidos" ───
// Dados históricos foram migrados para a planilha. O admin lê de lá via /api/pedidos.
const INIT_VENDAS=[];

const INIT_CUSTOS=[
  {id:1,mes:"Mar",data:"23/03",desp:"Compra Estoque",desc:"21Kg",forn:"Rei das Castanhas",cat:"Matéria-prima",valor:1319.19,pag:"Leo",reemb:300},
  {id:2,mes:"Mar",data:"23/03",desp:"Frete Compra",desc:"",forn:"Rei das Castanhas",cat:"Frete",valor:93,pag:"Felipe",reemb:93},
  {id:3,mes:"Mar",data:"23/03",desp:"Compra Embalagens",desc:"Pacotes 40g e Adesivos",forn:"BVCop",cat:"Embalagem",valor:122.48,pag:"Leo",reemb:122.48},
  {id:4,mes:"Mar",data:"25/03",desp:"Feira Jardim Secreto",desc:"1ª Parcela",forn:"Jardim Secreto",cat:"Feira/Eventos",valor:800,pag:"Kroc",reemb:0},
  {id:5,mes:"Mar",data:"27/03",desp:"Adesivos",desc:"",forn:"BVCop",cat:"Embalagem",valor:325,pag:"Leo",reemb:325},
  {id:6,mes:"Mar",data:"27/03",desp:"Pagamento Luli",desc:"",forn:"",cat:"Outros",valor:500,pag:"Leo",reemb:500},
  {id:7,mes:"Mar",data:"28/03",desp:"API WhatsApp",desc:"",forn:"Z-API",cat:"Marketing",valor:99.99,pag:"Kroc",reemb:0},
  {id:8,mes:"Mar",data:"30/03",desp:"Compra Estoque",desc:"32Kg",forn:"Rei das Castanhas",cat:"Matéria-prima",valor:2098,pag:"Caio",reemb:983.33},
  {id:9,mes:"Abr",data:"04/04",desp:"Pacotes 500g",desc:"50un",forn:"OLLYPOP",cat:"Embalagem",valor:87.98,pag:"Kroc",reemb:0},
  {id:10,mes:"Abr",data:"08/04",desp:"Ingredientes",desc:"2,5kg",forn:"Quatro estrelas",cat:"Matéria-prima",valor:192.52,pag:"Kroc",reemb:0},
  {id:11,mes:"Abr",data:"09/04",desp:"Ingredientes",desc:"2kg",forn:"Quatro estrelas",cat:"Matéria-prima",valor:190.83,pag:"Kroc",reemb:0},
  {id:12,mes:"Abr",data:"11/04",desp:"Anúncio Instagram",desc:"",forn:"Instagram",cat:"Marketing",valor:104.45,pag:"Kroc",reemb:0},
  {id:13,mes:"Abr",data:"14/04",desp:"Ingredientes teste",desc:"13kg",forn:"Veneza",cat:"Matéria-prima",valor:533,pag:"Kroc",reemb:0},
];

// ─── DESIGN ───
const f=`'DM Sans',sans-serif`,mo=`'JetBrains Mono',monospace`;
const X={bg:"#FAF8F5",card:"#FFF",bdr:"#E8E2DA",txt:"#2D2A26",mut:"#8C857B",acc:"#C8762D",accL:"#FBF0E4",sb:"#2D2A26",sbT:"#D4CFC8",sbA:"#C8762D",red:"#DC2626",grn:"#16A34A",blu:"#2563EB"};

// ─── HELPERS ───
const brl=v=>{const n=Number(v||0);return`R$ ${n.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}`};
// PARSING SEGURO: trata strings "YYYY-MM-DD" como data LOCAL (não UTC), evitando bug de timezone
// SEMPRE retorna um Date válido (nunca null) — fallback é new Date(0) para não quebrar consumidores
const parseDate=d=>{
  if(!d)return new Date(0);
  if(d instanceof Date)return isNaN(d.getTime())?new Date(0):d;
  const s=String(d);
  const m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(m)return new Date(+m[1],+m[2]-1,+m[3]);
  const fallback=new Date(s);
  return isNaN(fallback.getTime())?new Date(0):fallback;
};
const P=n=>String(n).padStart(2,"0");
const fdt=d=>{if(!d)return"—";const x=parseDate(d);if(x.getTime()===0)return"—";return`${P(x.getDate())}/${P(x.getMonth()+1)}/${x.getFullYear()}`};
const fds=d=>{if(!d)return"—";const x=parseDate(d);if(x.getTime()===0)return"—";return`${P(x.getDate())}/${P(x.getMonth()+1)}`};
const today=()=>{const d=new Date();return`${d.getFullYear()}-${P(d.getMonth()+1)}-${P(d.getDate())}`};
const mesAbrev=d=>{const x=parseDate(d);return["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][x.getMonth()]||""};
// Capitaliza nome: "joao DA silva" -> "Joao da Silva". Preposições ficam minúsculas.
const cap=(s)=>{
  if(!s)return "";
  const lowers=["de","da","do","das","dos","e","di","du"];
  return s.trim().toLowerCase().split(/\s+/).map((w,i)=>{
    if(i>0&&lowers.includes(w))return w;
    return w.charAt(0).toUpperCase()+w.slice(1);
  }).join(" ");
};
// ─── Cupom escopo helpers ───
const escopoToArr=(esc)=>{
  if(!esc)return["240g","500g"];
  if(esc==="pedido")return["240g","500g"];
  if(esc==="pedido_frete")return["240g","500g","frete"];
  if(esc==="frete")return["frete"];
  if(esc==="240g")return["240g"];
  if(esc==="500g")return["500g"];
  return esc.split(",").map(s=>s.trim()).filter(Boolean);
};
const escopoLabel=(esc)=>{
  const arr=escopoToArr(esc);
  const parts=[];
  if(arr.includes("240g"))parts.push("240g");
  if(arr.includes("500g"))parts.push("500g");
  if(arr.includes("frete"))parts.push("frete");
  if(parts.length===3)return"tudo";
  return parts.join(" + ")||"—";
};

// ─── Product chips component ───
function ProdChips({q40,q240,q500,qMel}){
  const items=[];
  if(q500)items.push({n:q500,tag:"500g",cor:"#7C3AED",bg:"#F3E8FF"});
  if(q240)items.push({n:q240,tag:"240g",cor:"#2563EB",bg:"#DBEAFE"});
  if(q40)items.push({n:q40,tag:"40g",cor:"#F59E0B",bg:"#FEF3C7"});
  if(qMel)items.push({n:qMel,tag:"🍯Mel",cor:"#CA8A04",bg:"#FEF9C3"});
  if(!items.length) return <span style={{color:X.mut}}>—</span>;
  return <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{items.map(i=>(
    <span key={i.tag} style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 8px",borderRadius:12,fontSize:11,fontWeight:700,color:i.cor,background:i.bg}}>
      {i.n}×{i.tag}
    </span>
  ))}</div>;
}

// ─── UI PRIMITIVES ───
const th={padding:"10px 12px",textAlign:"left",fontWeight:600,color:X.mut,fontSize:11,textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap",borderBottom:`2px solid ${X.bdr}`};
const td_={padding:"10px 12px",borderBottom:`1px solid ${X.bdr}`,fontSize:13};
const Badge=({t,c,bg})=><span style={{padding:"3px 8px",borderRadius:20,fontSize:11,fontWeight:600,color:c,background:bg,whiteSpace:"nowrap"}}>{t}</span>;
const Btn=({children,onClick,primary,danger,small,disabled,style:s})=><button disabled={disabled} onClick={onClick} style={{padding:small?"6px 12px":"10px 20px",borderRadius:8,border:primary||danger?"none":`1px solid ${X.bdr}`,background:disabled?"#D4CFC8":danger?X.red:primary?X.acc:"transparent",color:primary||danger?"#FFF":X.txt,fontSize:small?12:13,fontWeight:600,cursor:disabled?"default":"pointer",fontFamily:f,...s}}>{children}</button>;
const Inp=({label,value,onChange,type,ph,mono:mn,style:s})=><div style={{marginBottom:12,...s}}>{label&&<label style={{fontSize:12,fontWeight:600,color:X.mut,display:"block",marginBottom:4}}>{label}</label>}<input type={type||"text"} step={type==="number"?"any":undefined} placeholder={ph} value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"10px 14px",fontSize:13,border:`1px solid ${X.bdr}`,borderRadius:8,fontFamily:mn?mo:f,outline:"none",background:X.bg,boxSizing:"border-box"}}/></div>;
const Sel=({label,value,onChange,opts})=><div style={{marginBottom:12}}>{label&&<label style={{fontSize:12,fontWeight:600,color:X.mut,display:"block",marginBottom:4}}>{label}</label>}<select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"10px 14px",fontSize:13,border:`1px solid ${X.bdr}`,borderRadius:8,fontFamily:f,background:X.bg,boxSizing:"border-box"}}>{opts.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}</select></div>;

function Modal({title,onClose,children,wide}){
  return<><div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:200}}/><div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:wide?660:480,maxHeight:"85vh",background:X.card,borderRadius:16,boxShadow:"0 20px 60px rgba(0,0,0,0.2)",zIndex:201,display:"flex",flexDirection:"column",overflow:"hidden"}}><div style={{padding:"20px 24px",borderBottom:`1px solid ${X.bdr}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{margin:0,fontSize:18,fontWeight:700}}>{title}</h2><button onClick={onClose} style={{width:32,height:32,borderRadius:8,border:`1px solid ${X.bdr}`,background:"transparent",cursor:"pointer",fontSize:16,color:X.mut}}>✕</button></div><div style={{padding:24,overflow:"auto",flex:1}}>{children}</div></div></>;
}

// ═══ COMPONENTE: FRETE CONFIG ═══
function FreteConfigSection({config,onSave,onGeocode,loading,geocoding,show}){
  const mo="ui-monospace,'SF Mono',Menlo,Consolas,monospace";
  const [endInput,setEndInput]=useState("");
  const [faixas,setFaixas]=useState([]);
  const [dirty,setDirty]=useState(false);
  const mapRef=useRef(null);
  const mapInstRef=useRef(null);
  const circlesRef=useRef([]);
  const markerRef=useRef(null);

  useEffect(()=>{
    if(config){
      setEndInput(config.endereco||"");
      setFaixas(Array.isArray(config.faixas)?config.faixas:[]);
      setDirty(false);
    }
  },[config]);

  const [leafletReady,setLeafletReady]=useState(false);

  // Carrega Leaflet se ainda não tiver
  useEffect(()=>{
    if(typeof window==="undefined")return;
    if(window.L){setLeafletReady(true);return;}
    // CSS
    if(!document.querySelector('link[href*="leaflet.css"]')){
      const css=document.createElement("link");
      css.rel="stylesheet";css.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);
    }
    // JS — se já existe um script, escuta ele
    const existingJs=document.querySelector('script[src*="leaflet.js"]');
    if(existingJs){
      existingJs.addEventListener("load",()=>setLeafletReady(true));
      // Pode ter carregado antes
      if(window.L)setLeafletReady(true);
      return;
    }
    const js=document.createElement("script");
    js.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    js.onload=()=>setLeafletReady(true);
    js.onerror=()=>console.error("Falha ao carregar Leaflet");
    document.body.appendChild(js);
  },[]);

  // Desenha/redesenha o mapa quando config muda OU quando Leaflet carrega
  useEffect(()=>{
    if(!config||!mapRef.current||!leafletReady||typeof window==="undefined"||!window.L)return;
    const L=window.L;
    // Inicializa mapa se ainda não existir
    if(!mapInstRef.current){
      mapInstRef.current=L.map(mapRef.current,{
        zoomControl:true,
        attributionControl:false,
        scrollWheelZoom:true
      }).setView([config.centro_lat,config.centro_lng],13);
      // Tile style moderno (CartoDB Positron — clean, parece Apple Maps)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",{
        attribution:'© OpenStreetMap © CARTO',
        subdomains:"abcd",
        maxZoom:20
      }).addTo(mapInstRef.current);
      L.control.attribution({prefix:false,position:"bottomright"}).addTo(mapInstRef.current);
      setTimeout(()=>mapInstRef.current&&mapInstRef.current.invalidateSize(),100);
    }
    // Limpa marker e círculos antigos
    if(markerRef.current){mapInstRef.current.removeLayer(markerRef.current);markerRef.current=null;}
    circlesRef.current.forEach(c=>mapInstRef.current.removeLayer(c));
    circlesRef.current=[];
    // Pino customizado (divIcon SVG — mais moderno que o pin default laranja)
    const pinIcon=L.divIcon({
      className:"kroc-pin",
      html:`<div style="position:relative;width:28px;height:36px;">
        <svg viewBox="0 0 24 32" width="28" height="36" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z" fill="#C8762D" stroke="#fff" stroke-width="1.5"/>
          <circle cx="12" cy="12" r="4.5" fill="#fff"/>
        </svg>
      </div>`,
      iconSize:[28,36],
      iconAnchor:[14,36],
      popupAnchor:[0,-36]
    });
    markerRef.current=L.marker([config.centro_lat,config.centro_lng],{icon:pinIcon}).addTo(mapInstRef.current).bindPopup(`<strong>📍 Centro</strong><br/>${config.endereco||""}`);
    mapInstRef.current.setView([config.centro_lat,config.centro_lng],13);
    // Círculos por faixa — cores mais limpas, opacidade menor
    const cores=["#10B981","#F59E0B","#EF4444","#8B5CF6","#06B6D4","#EC4899","#14B8A6"];
    const faixasOrdenadas=[...(config.faixas||[])].sort((a,b)=>a.km_max-b.km_max);
    faixasOrdenadas.forEach((f,i)=>{
      const raio=Math.min(f.km_max,10)*1000;
      const cor=cores[i%cores.length];
      const circle=L.circle([config.centro_lat,config.centro_lng],{
        radius:raio,
        color:cor,
        fillColor:cor,
        fillOpacity:0.06,
        weight:1.5,
        opacity:0.7,
        dashArray:i===faixasOrdenadas.length-1?"4,4":null
      }).addTo(mapInstRef.current);
      circle.bindTooltip(`<strong>${f.label||"até "+f.km_max+"km"}</strong><br/>Frete: R$ ${(+f.valor||0).toFixed(2)}`,{direction:"top",offset:[0,-10]});
      circlesRef.current.push(circle);
    });
    // Ajusta zoom pra caber todas as faixas (até 5km — evita zoom muito out)
    const maxKm=Math.min(5,Math.max(...(faixasOrdenadas.map(f=>f.km_max))));
    if(maxKm>0){
      const bounds=L.latLng(config.centro_lat,config.centro_lng).toBounds(maxKm*2000);
      mapInstRef.current.fitBounds(bounds,{padding:[20,20],maxZoom:14});
    }
  },[config,leafletReady]);

  const geocodeAndSave=async()=>{
    const coords=await onGeocode(endInput);
    if(coords){
      await onSave({endereco:endInput,centro_lat:coords.lat,centro_lng:coords.lng});
      if(coords.displayName)show(`📍 Pino: ${coords.displayName.slice(0,60)}...`);
    }else{
      show("❌ Endereço não encontrado. Tenta formato: 'Rua Nome, 123, Bairro, Cidade, UF' ou inclui o CEP.");
    }
  };

  const addFaixa=()=>{
    const ultimaFaixa=faixas[faixas.length-1];
    const novaKm=ultimaFaixa?ultimaFaixa.km_max+2:3;
    const novoValor=ultimaFaixa?+ultimaFaixa.valor+5:5;
    setFaixas([...faixas,{km_max:novaKm,valor:novoValor,label:`Até ${novaKm}km`}]);
    setDirty(true);
  };
  const removeFaixa=(idx)=>{
    if(faixas.length<=1){show("⚠️ Precisa ter pelo menos 1 faixa");return;}
    setFaixas(faixas.filter((_,i)=>i!==idx));
    setDirty(true);
  };
  const updateFaixa=(idx,field,value)=>{
    setFaixas(faixas.map((f,i)=>i===idx?{...f,[field]:field==="label"?value:+value}:f));
    setDirty(true);
  };
  const saveFaixas=async()=>{
    // Ordena por km_max e salva
    const ordenadas=[...faixas].sort((a,b)=>a.km_max-b.km_max);
    await onSave({faixas:ordenadas});
    setDirty(false);
  };

  if(!config){
    return<div style={{background:X.card,borderRadius:10,border:`2px solid ${X.bdr}`,padding:20,marginBottom:20}}>
      <h3 style={{margin:0,fontSize:14,fontWeight:700}}>🚚 Frete</h3>
      <p style={{margin:"8px 0 0",fontSize:12,color:X.mut}}>Carregando... (se persistir, rode o SQL <code>01_frete_config.sql</code>)</p>
    </div>;
  }

  return<div style={{background:X.card,borderRadius:10,border:`2px solid ${X.bdr}`,padding:20,marginBottom:20}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <div>
        <h3 style={{margin:0,fontSize:14,fontWeight:700}}>🚚 Frete — Endereço de centro & Faixas</h3>
        <p style={{margin:"2px 0 0",fontSize:11,color:X.mut}}>O site calcula frete por distância até o centro. Edite abaixo e veja o mapa atualizar.</p>
      </div>
    </div>

    {/* Endereço do centro */}
    <div style={{background:X.bg,borderRadius:8,padding:12,marginBottom:14,border:`1px solid ${X.bdr}`}}>
      <p style={{margin:"0 0 8px",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,color:X.mut}}>📍 Endereço de centro (origem das entregas)</p>
      <div style={{display:"flex",gap:8}}>
        <input value={endInput} onChange={e=>setEndInput(e.target.value)} placeholder="Ex: Rua Ministro Godoi 679, Água Branca, São Paulo, SP" style={{flex:1,padding:"10px 12px",border:`1px solid ${X.bdr}`,borderRadius:6,fontSize:13,fontFamily:"inherit"}}/>
        <button onClick={geocodeAndSave} disabled={geocoding||loading||!endInput.trim()} style={{padding:"10px 14px",borderRadius:6,border:"none",background:X.acc,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",opacity:(geocoding||loading)?.6:1}}>{geocoding?"Buscando...":loading?"Salvando...":"💾 Salvar"}</button>
      </div>
      <p style={{margin:"6px 0 0",fontSize:10,color:X.mut}}>Coords atuais: <code style={{fontFamily:mo}}>{(+config.centro_lat).toFixed(5)}, {(+config.centro_lng).toFixed(5)}</code></p>
    </div>

    {/* Mapa Leaflet */}
    <div ref={mapRef} style={{height:360,width:"100%",borderRadius:10,marginBottom:10,border:`1px solid ${X.bdr}`,background:"#f3f4f6",overflow:"hidden",boxShadow:"inset 0 1px 3px rgba(0,0,0,0.05)"}}/>
    
    {/* Legenda das faixas */}
    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14,padding:"6px 4px"}}>
      {(()=>{
        const cores=["#10B981","#F59E0B","#EF4444","#8B5CF6","#06B6D4","#EC4899","#14B8A6"];
        const faixasOrd=[...(config.faixas||[])].sort((a,b)=>a.km_max-b.km_max);
        return faixasOrd.map((f,i)=><div key={i} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 10px",background:cores[i%cores.length]+"15",border:`1px solid ${cores[i%cores.length]}40`,borderRadius:100,fontSize:11}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:cores[i%cores.length],display:"inline-block"}}/>
          <span style={{color:X.txt,fontWeight:600}}>{f.label||"até "+f.km_max+"km"}</span>
          <span style={{color:X.mut,fontFamily:mo}}>R$ {(+f.valor||0).toFixed(2)}</span>
        </div>);
      })()}
    </div>

    {/* Tabela de faixas */}
    <div style={{background:X.bg,borderRadius:8,padding:12,border:`1px solid ${X.bdr}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <p style={{margin:0,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,color:X.mut}}>⚡ Faixas de frete (ordenadas por distância)</p>
        <div style={{display:"flex",gap:6}}>
          <button onClick={addFaixa} style={{padding:"6px 10px",borderRadius:6,border:`1px solid ${X.acc}`,background:"#fff",color:X.acc,fontSize:11,fontWeight:600,cursor:"pointer"}}>+ Adicionar faixa</button>
          {dirty&&<button onClick={saveFaixas} disabled={loading} style={{padding:"6px 10px",borderRadius:6,border:"none",background:X.grn,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>{loading?"...":"💾 Salvar"}</button>}
        </div>
      </div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead>
          <tr style={{borderBottom:`1px solid ${X.bdr}`}}>
            <th style={{padding:"6px 8px",textAlign:"left",color:X.mut,fontSize:10,fontWeight:700}}>LABEL</th>
            <th style={{padding:"6px 8px",textAlign:"center",color:X.mut,fontSize:10,fontWeight:700}}>ATÉ KM</th>
            <th style={{padding:"6px 8px",textAlign:"right",color:X.mut,fontSize:10,fontWeight:700}}>VALOR R$</th>
            <th style={{padding:"6px 8px",width:40}}></th>
          </tr>
        </thead>
        <tbody>
          {faixas.map((f,i)=><tr key={i} style={{borderBottom:`1px solid ${X.bdr}`}}>
            <td style={{padding:"6px 8px"}}><input value={f.label||""} onChange={e=>updateFaixa(i,"label",e.target.value)} style={{width:"100%",padding:"6px 8px",border:`1px solid ${X.bdr}`,borderRadius:4,fontSize:12,fontFamily:"inherit"}} placeholder="Ex: Até 3km"/></td>
            <td style={{padding:"6px 8px"}}><input type="number" value={f.km_max} onChange={e=>updateFaixa(i,"km_max",e.target.value)} style={{width:"100%",padding:"6px 8px",border:`1px solid ${X.bdr}`,borderRadius:4,fontSize:12,fontFamily:mo,textAlign:"center"}}/></td>
            <td style={{padding:"6px 8px"}}><input type="number" step="0.01" value={f.valor} onChange={e=>updateFaixa(i,"valor",e.target.value)} style={{width:"100%",padding:"6px 8px",border:`1px solid ${X.bdr}`,borderRadius:4,fontSize:12,fontFamily:mo,textAlign:"right"}}/></td>
            <td style={{padding:"6px 8px",textAlign:"center"}}><button onClick={()=>removeFaixa(i)} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:X.red}} title="Remover">🗑️</button></td>
          </tr>)}
        </tbody>
      </table>
      {dirty&&<p style={{margin:"10px 0 0",fontSize:10,color:"#F59E0B",fontWeight:600}}>⚠️ Alterações não salvas. Clique em "Salvar" acima.</p>}
    </div>

    <p style={{margin:"14px 0 0",fontSize:11,color:X.mut}}>💡 O site calcula o frete usando estas faixas: encontra a primeira faixa cujo <code>km_max</code> seja ≥ distância, e cobra o valor correspondente.</p>
  </div>;
}

// ═══ COMPONENTE GLOBAL: FormSection (usado nos modais de Nova Venda e Editar Venda) ═══
// Declarado fora do App pra manter referência estável — senão os inputs perdem o foco
// a cada keystroke porque o React desmonta/remonta o Section a cada render.
function FormSection({title,children,cols,hint}){
  return<div style={{marginBottom:14,padding:"12px 14px",background:X.bg,borderRadius:8,border:`1px solid ${X.bdr}`}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <p style={{margin:0,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,color:"#8C857B"}}>{title}</p>
      {hint&&<p style={{margin:0,fontSize:10,color:"#8C857B",fontStyle:"italic"}}>{hint}</p>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:cols||"1fr 1fr",gap:10}}>{children}</div>
  </div>;
}

// ═══ MAIN ═══
export default function App(){
  const LS=(k,fb)=>{try{const d=localStorage.getItem(`k_${k}`);return d?JSON.parse(d):fb}catch{return fb}};
  const SS=(k,v)=>{try{localStorage.setItem(`k_${k}`,JSON.stringify(v))}catch{}};

  const[user,setUser]=useState(()=>LS("user",null));
  const[lembrar,setLembrar]=useState(()=>LS("login_lembrar",true));
  const[loginHistory,setLoginHistory]=useState(()=>LS("login_history",[]));
  
  // Persiste user automaticamente
  useEffect(()=>{
    try{
      if(user&&lembrar){
        localStorage.setItem("k_user",JSON.stringify(user));
      }else if(!user){
        localStorage.removeItem("k_user");
      }
    }catch(e){}
  },[user,lembrar]);
  
  useEffect(()=>{try{localStorage.setItem("k_login_lembrar",JSON.stringify(lembrar))}catch(e){}},[lembrar]);
  useEffect(()=>{try{localStorage.setItem("k_login_history",JSON.stringify(loginHistory))}catch(e){}},[loginHistory]);
  const[tab,setTab]=useState("dashboard");
  // Estados interativos do Dashboard
  const[dashPeriodo,setDashPeriodo]=useState(30);  // 7, 30, 90, "all"
  const[dashHover,setDashHover]=useState(null);  // {tipo, x, y, label, ...}
  const[dashFiltroMes,setDashFiltroMes]=useState(null);  // YYYY-MM ou null
  const[dashFiltroSku,setDashFiltroSku]=useState(null);  // "40g" | "240g" | "500g" | null
  const[dashFiltroCanal,setDashFiltroCanal]=useState(null);
  const[vendas,setVendas]=useState(()=>{
    // Supabase é a fonte única de verdade para vendas.
    // Limpa qualquer localStorage antigo que possa causar duplicações.
    try{localStorage.removeItem("k_vendas");}catch(e){}
    return [];
  });
  const[ing,setIng]=useState([]);
  // mel state separado (produto pra revenda, vem pronto)
  const[melCompras,setMelCompras]=useState([]);
  const[lotes,setLotes]=useState([]);
  const[emb,setEmb]=useState([]);
  const[custos,setCustos]=useState([]);
  const[custoPagamentos,setCustoPagamentos]=useState([]); // Pagamentos (quem pagou quanto, pendente, quitado)
  const[baixas,setBaixas]=useState([]);           // Baixas (amostras/marketing/perdas)
  const[dispLotes,setDispLotes]=useState([]);     // View lotes_disponibilidade
  const[pedidoLotes,setPedidoLotes]=useState([]); // Alocações FIFO por pedido
  const[modal,setModal]=useState(null);
  const[toast,setToast]=useState(null);
  const[search,setSearch]=useState("");
  const[sortBy,setSortBy]=useState("id_desc");
  const[apiSt,setApiSt]=useState("idle");
  const[lastSync,setLastSync]=useState(()=>LS("sync",null));
  const[editItem,setEditItem]=useState(null);

  // Supabase é a fonte única — limpa localStorage antigo
  useEffect(()=>{try{["k_vendas","k_ing","k_lotes","k_emb","k_custos"].forEach(k=>localStorage.removeItem(k));}catch(e){}},[]);
  useEffect(()=>{if(user)SS("user",user);else localStorage.removeItem("k_user")},[user]);

  const show=msg=>{setToast(msg);setTimeout(()=>setToast(null),3000)};

  // ═══════════════════════════════════════════════════════════════
  // REALOCAÇÃO CLIENT-SIDE — fonte de verdade da lógica de alocação
  // 
  // Chamada sempre que algo muda: criar/editar lote, pedido, baixa.
  // Apaga todas as alocações no Supabase e insere as novas calculadas.
  // 
  // Regras:
  //  1. Entregues têm prioridade absoluta (viram "confirmada")
  //  2. Não-entregues entram FIFO por data de pedido (viram "preliminar")
  //  3. Lotes são consumidos cronologicamente (mais antigo primeiro)
  //  4. Baixas (pedido_num like "BX-*") não são tocadas
  // ═══════════════════════════════════════════════════════════════
  const realocarTudo=useCallback(async()=>{
    try{
      // Busca dados frescos do Supabase
      const [lotesRaw, pedidosRaw, alocacoesRaw] = await Promise.all([
        supaGet("lotes", "order=data.asc,lote_id.asc"),
        supaGet("pedidos", "select=pedido_num,data,qtd_40,qtd_240,qtd_500,qtd_mel,entrega,tipo&limit=1000&order=data.asc"),
        supaGet("pedido_lotes", "select=id,pedido_num&limit=5000")
      ]);
      
      if(!Array.isArray(lotesRaw)||!Array.isArray(pedidosRaw)||!Array.isArray(alocacoesRaw)){
        throw new Error("Dados inválidos do Supabase");
      }
      
      // Busca alocações completas (com qtd) pra calcular baixas
      const alocComplete=await supaGet("pedido_lotes","limit=5000");
      if(!Array.isArray(alocComplete))throw new Error("Falha ao buscar alocações");
      
      // ─── ETAPA 1: Calcula novas alocações em MEMÓRIA primeiro ───
      // (antes de deletar qualquer coisa no banco, garante que temos um resultado válido)
      const novasAlocacoes=[];
      const pedidosValidos=pedidosRaw.filter(p=>p.pedido_num&&(p.tipo||"Venda")==="Venda");
      
      for(const lote of lotesRaw){
        const isMel=(lote.tipo==="mel")||String(lote.lote_id||"").startsWith("MEL-");
        const baixasLote=alocComplete.filter(a=>a.lote_id===lote.lote_id&&String(a.pedido_num||"").startsWith("BX-"));
        const baixado_40=baixasLote.reduce((s,b)=>s+(b.qtd_40||0),0);
        const baixado_240=baixasLote.reduce((s,b)=>s+(b.qtd_240||0),0);
        const baixado_500=baixasLote.reduce((s,b)=>s+(b.qtd_500||0),0);
        const baixado_mel=baixasLote.reduce((s,b)=>s+(b.qtd_mel||0),0);
        
        let disp40=(lote.p40||0)-baixado_40;
        let disp240=(lote.p240||0)-baixado_240;
        let disp500=(lote.p500||0)-baixado_500;
        let dispMel=(lote.p_mel||0)-baixado_mel;
        
        const alocarPara=(listaPedidos,statusVal)=>{
          for(const ped of listaPedidos){
            if(isMel){
              if(dispMel<=0)break;
              // Lote de mel só aloca qtd_mel
              const jaAlocado=novasAlocacoes.filter(a=>a.pedido_num===ped.pedido_num);
              const alocMel=jaAlocado.reduce((s,a)=>s+(a.qtd_mel||0),0);
              const faltaMel=Math.max(0,(ped.qtd_mel||0)-alocMel);
              const pegarMel=Math.min(faltaMel,dispMel);
              if(pegarMel>0){
                novasAlocacoes.push({
                  pedido_num:ped.pedido_num,
                  lote_id:lote.lote_id,
                  qtd_40:0,qtd_240:0,qtd_500:0,
                  qtd_mel:pegarMel,
                  status:statusVal,
                  confirmada_em:statusVal==="confirmada"?new Date().toISOString():null
                });
                dispMel-=pegarMel;
              }
            }else{
              // Lote de granola — aloca 40/240/500
              if(disp40<=0&&disp240<=0&&disp500<=0)break;
              const jaAlocado=novasAlocacoes.filter(a=>a.pedido_num===ped.pedido_num);
              const aloc40=jaAlocado.reduce((s,a)=>s+(a.qtd_40||0),0);
              const aloc240=jaAlocado.reduce((s,a)=>s+(a.qtd_240||0),0);
              const aloc500=jaAlocado.reduce((s,a)=>s+(a.qtd_500||0),0);
              const falta40=Math.max(0,(ped.qtd_40||0)-aloc40);
              const falta240=Math.max(0,(ped.qtd_240||0)-aloc240);
              const falta500=Math.max(0,(ped.qtd_500||0)-aloc500);
              const pegar40=Math.min(falta40,disp40);
              const pegar240=Math.min(falta240,disp240);
              const pegar500=Math.min(falta500,disp500);
              if(pegar40>0||pegar240>0||pegar500>0){
                novasAlocacoes.push({
                  pedido_num:ped.pedido_num,
                  lote_id:lote.lote_id,
                  qtd_40:pegar40,qtd_240:pegar240,qtd_500:pegar500,
                  qtd_mel:0,
                  status:statusVal,
                  confirmada_em:statusVal==="confirmada"?new Date().toISOString():null
                });
                disp40-=pegar40;disp240-=pegar240;disp500-=pegar500;
              }
            }
          }
        };
        
        const entregues=pedidosValidos
          .filter(p=>String(p.entrega||"").toLowerCase().includes("entregue"))
          .sort((a,b)=>(a.data||"").localeCompare(b.data||"")||(a.pedido_num||"").localeCompare(b.pedido_num||""));
        alocarPara(entregues,"confirmada");
        
        const pendentes=pedidosValidos
          .filter(p=>!String(p.entrega||"").toLowerCase().includes("entregue"))
          .sort((a,b)=>(a.data||"").localeCompare(b.data||"")||(a.pedido_num||"").localeCompare(b.pedido_num||""));
        alocarPara(pendentes,"preliminar");
      }
      
      console.log(`[realocar] Calculadas ${novasAlocacoes.length} alocações em memória`);
      
      // ─── ETAPA 2: Identifica alocações a deletar (só não-baixas, por ID) ───
      const idsParaDeletar=alocComplete
        .filter(a=>!String(a.pedido_num||"").startsWith("BX-"))
        .map(a=>a.id)
        .filter(id=>id!=null);
      
      console.log(`[realocar] ${idsParaDeletar.length} alocações antigas a remover`);
      
      // ─── ETAPA 3: Deleta alocações antigas em chunks (por ID, seguro) ───
      if(idsParaDeletar.length>0){
        const CHUNK=50;
        for(let i=0;i<idsParaDeletar.length;i+=CHUNK){
          const chunk=idsParaDeletar.slice(i,i+CHUNK);
          const idList=chunk.join(",");
          const r=await fetch(`${SUPA_URL}/rest/v1/pedido_lotes?id=in.(${idList})`,{
            method:"DELETE",
            headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Prefer":"return=minimal"}
          });
          if(!r.ok){
            const txt=await r.text();
            throw new Error(`Falha ao deletar chunk ${i}: ${txt.slice(0,100)}`);
          }
        }
      }
      
      // ─── ETAPA 4: Insere novas alocações em chunks ───
      if(novasAlocacoes.length>0){
        const CHUNK=50;
        for(let i=0;i<novasAlocacoes.length;i+=CHUNK){
          const chunk=novasAlocacoes.slice(i,i+CHUNK);
          const r=await fetch(`${SUPA_URL}/rest/v1/pedido_lotes`,{
            method:"POST",
            headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},
            body:JSON.stringify(chunk)
          });
          if(!r.ok){
            const txt=await r.text();
            console.error("[realocar] erro insert chunk:",txt);
            throw new Error(`Falha ao inserir chunk ${i}: ${txt.slice(0,100)}`);
          }
        }
      }
      
      console.log(`[realocar] ✅ Sucesso: ${novasAlocacoes.length} alocações gravadas`);
      return {ok:true,total:novasAlocacoes.length};
    }catch(e){
      console.error("[realocar] ❌ FALHOU:",e);
      show(`❌ Realocação falhou: ${e.message.slice(0,120)}`);
      return {ok:false,error:e.message};
    }
  },[]);

  // Popular unidades faltantes no Supabase (client-side)
  // Pra cada lote, garante que há registros em `unidades` pros p40/p240/p500
  const popularUnidades=useCallback(async()=>{
    try{
      const [lotesRaw,unidadesRaw]=await Promise.all([
        supaGet("lotes","order=data.asc"),
        supaGet("unidades","limit=10000")
      ]);
      if(!Array.isArray(lotesRaw)||!Array.isArray(unidadesRaw))return;
      
      const novasUnidades=[];
      for(const lote of lotesRaw){
        // Extrai ano (2 dígitos) da data do lote (YYYY-MM-DD → YY)
        const ano=lote.data?String(lote.data).slice(2,4):"00";
        // SKUs por tipo de lote: granola (40/240/500) ou mel (mel)
        const tipoLote=lote.tipo||"granola";
        const skusDoLote=tipoLote==="mel"?["mel"]:["40","240","500"];
        for(const sku of skusDoLote){
          const qtdKey=sku==="mel"?"p_mel":`p${sku}`;
          const qtdTotal=lote[qtdKey]||0;
          const existentes=unidadesRaw.filter(u=>u.lote_id===lote.lote_id&&u.sku===sku);
          const seqsExistentes=new Set(existentes.map(u=>u.seq_no_lote));
          // Padroniza SKU: 40→040, 240→240, 500→500, mel→MEL
          const skuPad=sku==="mel"?"MEL":String(sku).padStart(3,"0");
          for(let seq=1;seq<=qtdTotal;seq++){
            if(!seqsExistentes.has(seq)){
              // Formato semântico: AA-SSS-LXXX-NNN
              //   AA   = ano 2 dígitos
              //   SSS  = SKU (040/240/500/MEL)
              //   LXXX = lote_id (ex: L015 ou MEL-001)
              //   NNN  = sequencial dentro do lote+SKU (zerado, 3 dígitos)
              const id=`${ano}-${skuPad}-${lote.lote_id}-${String(seq).padStart(3,"0")}`;
              novasUnidades.push({id,lote_id:lote.lote_id,sku,seq_no_lote:seq,tipo:sku==="mel"?"mel":"granola"});
            }
          }
        }
      }
      
      if(novasUnidades.length){
        await fetch(`${SUPA_URL}/rest/v1/unidades`,{
          method:"POST",
          headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},
          body:JSON.stringify(novasUnidades)
        });
        console.log(`[unidades] ${novasUnidades.length} unidades criadas`);
      }
    }catch(e){console.warn("[unidades] erro:",e);}
  },[]);

  // Helper: roda popularUnidades + realocarTudo + sync em sequência
  // (definido depois que sync/fetchUnidades existem — ver abaixo)

  // ─── AUTO-SYNC: poll Google Sheets CSV every 2min ───
  const parseBR=s=>{if(!s)return 0;const c=String(s).replace(/\./g,"").replace(",",".");return parseFloat(c)||0};
  // (parseDate local removido — usa o global que retorna Date object)
  const sync=useCallback(async()=>{
    setApiSt("loading");
    try{
      const pedidos=await supaGet("pedidos","order=data.desc,hora.desc&limit=500");
      console.log("[Kroc Sync] Supabase respondeu:",pedidos);
      if(!Array.isArray(pedidos)){
        setApiSt("error");
        const msg=pedidos&&pedidos.message?pedidos.message:JSON.stringify(pedidos);
        console.warn("[Kroc Sync] resposta inválida:",msg);
        show(`⚠️ ${msg.slice(0,80)}`);
        return;
      }
      console.log(`[Kroc Sync] ${pedidos.length} pedidos no Supabase`);
      const mapped=pedidos.map(p=>{
        const id=String(p.pedido_num||"").trim();
        const cliente=cap(String(p.cliente||"").trim());
        if(!id||!cliente)return null;
        const q40=p.qtd_40||0;
        const q240=p.qtd_240||0;
        const q500=p.qtd_500||0;
        const qMel=p.qtd_mel||0;
        const rec=parseFloat(p.total)||0;
        const frete=parseFloat(p.frete)||0;
        // Custo unitário: mel é custo médio das compras (calculado dinamicamente em prodCusto, fallback 25)
        const custoMelEstimado=25;
        const custo=p.custo!=null?parseFloat(p.custo):(q40*4.34)+(q240*16.64)+(q500*34.41)+(qMel*custoMelEstimado);
        const lucro=p.lucro!=null?parseFloat(p.lucro):rec-custo-frete;
        return{
          id,
          _supaId:p.id,
          data:p.data||today(),
          lote:p.lote||"",
          tipo:p.tipo||"Venda",
          comp:cliente,
          canal:p.canal||"Online",
          q40,q240,q500,qMel,frete,
          rec,custo,lucro,
          // Se está entregue, implica produzido (coerência de dados)
          prod:String(p.entrega||"").toLowerCase().includes("entregue")||String(p.producao||"").toLowerCase().includes("produzido")||String(p.producao||"").toLowerCase().includes("entregue"),
          entreg:String(p.entrega||"").toLowerCase().includes("entregue"),
          pago:String(p.pagamento||"").toLowerCase().includes("pago"),
          met:p.metodo||"Site",
          obs:p.observacoes||"",
          cupomCode:p.cupom_code||"",
          descontoValor:parseFloat(p.desconto_valor)||0,
          subtotal:parseFloat(p.subtotal)||0,
          _fromSupabase:true,
          _email:p.email||"",_tel:p.telefone||"",
          _rua:p.rua||"",_num:p.numero||"",
          _comp:p.complemento||"",_bairro:p.bairro||"",
          _cidade:p.cidade||"São Paulo",_estado:p.estado||"SP",_cep:p.cep||"",
        };
      }).filter(Boolean);
      if(mapped.length>0){
        let pedidosNovos=0;
        setVendas(prev=>{
          // Fonte única de verdade = Supabase. Remove TODOS os _fromSupabase antigos e colisões por ID.
          const supaIds=new Set(mapped.map(m=>m.id));
          const nonSupa=prev.filter(v=>!v._fromSupabase&&!supaIds.has(v.id));
          // Detecta pedidos NOVOS: estavam no Supabase agora mas não estavam antes
          const idsAntigos=new Set(prev.filter(v=>v._fromSupabase).map(v=>v.id));
          pedidosNovos=mapped.filter(m=>!idsAntigos.has(m.id)).length;
          const merged=[...nonSupa,...mapped];
          merged.sort((a,b)=>(b.data||"").localeCompare(a.data||""));
          return merged;
        });
        console.log(`[Kroc Sync] ${mapped.length} pedidos sincronizados do Supabase (${pedidosNovos} novos)`);
        // Se houve pedidos novos, dispara realocação automática FIFO em background
        // Pequeno delay pra dar tempo do setVendas processar
        if(pedidosNovos>0){
          setTimeout(()=>{
            console.log(`[Auto-realocar] ${pedidosNovos} pedido(s) novo(s) detectado(s), realocando...`);
            realocarTudo().catch(e=>console.warn("[Auto-realocar] erro:",e));
          },500);
        }
      }

      // ─── Estoque FIFO: pedido_lotes, baixas ───
      // (view lotes_disponibilidade removida — cálculo agora é client-side via lotesCalc)
      try{
        const[plotes,bxs,lotesData,ingData,embData,custosData,cpData]=await Promise.all([
          supaGet("pedido_lotes","order=created_at.asc&limit=1000"),
          supaGet("baixas","order=data.desc"),
          supaGet("lotes","order=data.asc"),
          supaGet("ingredientes","order=id.asc"),
          supaGet("embalagens","order=id.asc"),
          supaGet("custos","order=data.desc"),
          supaGet("custo_pagamentos","order=custo_id.desc")
        ]);
        // dispLotes mantido vazio pra compatibilidade — não usado mais
        if(Array.isArray(plotes))setPedidoLotes(plotes);
        if(Array.isArray(bxs))setBaixas(bxs.map(b=>({
          _supaId:b.id,id:b.id,
          data:b.data,motivo:b.motivo,cat:b.categoria,
          desc:b.descricao||"",destin:b.destinatario||"",
          q40:b.qtd_40,q240:b.qtd_240,q500:b.qtd_500,qMel:b.qtd_mel||0,
          custo:parseFloat(b.custo_total)||0
        })));
        if(Array.isArray(lotesData))setLotes(lotesData.map(l=>({
          _supaId:l.id,id:l.lote_id,data:l.data,kg:parseFloat(l.kg)||0,
          p40:l.p40||0,p240:l.p240||0,p500:l.p500||0,pMel:l.p_mel||0,
          tipo:l.tipo||"granola",sobra:parseFloat(l.sobra)||0
        })));
        if(Array.isArray(ingData))setIng(ingData.map(i=>({
          _supaId:i.id,nome:i.nome,prop:parseFloat(i.prop)||0,
          precoKg:parseFloat(i.preco_kg)||0,comprado:parseFloat(i.comprado)||0
        })));
        if(Array.isArray(embData))setEmb(embData.map(e=>({
          _supaId:e.id,nome:e.nome,
          comprado:e.comprado||0,usado:e.usado||0,
          precoMedio:parseFloat(e.preco_medio)||0
        })));
        if(Array.isArray(custosData))setCustos(custosData.map(c=>({
          _supaId:c.id,id:c.id,mes:c.mes,data:c.data,
          desp:c.despesa,desc:c.descricao||"",forn:c.fornecedor||"",
          cat:c.categoria,valor:parseFloat(c.valor)||0,
          pag:c.pagador,reemb:parseFloat(c.reemb)||0,formaPgto:c.forma_pgto||"",recorrente:!!c.recorrente
        })));
        if(Array.isArray(cpData))setCustoPagamentos(cpData.map(p=>({
          _supaId:p.id,
          custoId:p.custo_id,
          pagador:p.pagador,
          valorPago:parseFloat(p.valor_pago)||0,
          reembPendente:parseFloat(p.valor_reemb_pendente)||0,
          reembQuitado:parseFloat(p.valor_reemb_quitado)||0,
          quitadoEm:p.quitado_em,quitadoPor:p.quitado_por,
          obs:p.observacoes||""
        })));
        console.log(`[Kroc Sync] FIFO: ${plotes?.length||0} alocações, ${bxs?.length||0} baixas. Estoque: ${lotesData?.length||0}L, ${ingData?.length||0}I, ${embData?.length||0}E, ${custosData?.length||0}C`);
      }catch(e){console.warn("[Kroc Sync FIFO]",e.message);}

      setApiSt("ok");const now=new Date().toISOString();setLastSync(now);SS("sync",now);
    }catch(e){console.warn("[Kroc Sync]",e.message);setApiSt("error")}
  },[]);
  useEffect(()=>{if(!user)return;sync();const iv=setInterval(sync,15000);return()=>clearInterval(iv)},[user]);

  // ─── FIFO ALOCAÇÃO ─────────────────────────────────────────────
  // Aloca qtd de cada produto do(s) lote(s) mais antigo(s) disponível(is).
  // Granolas alocam em lotes de granola, mel aloca em lotes MEL-XXX.
  const computeFIFO=(q40,q240,q500,qMel=0)=>{
    const alocs=[];
    let r40=q40,r240=q240,r500=q500,rMel=qMel;
    const lotesSrc=lotesCalc
      .filter(l=>l.dias>=0)
      .map(l=>({lote_id:l.id,isMel:l.isMel,disp40:l.disp40||0,disp240:l.disp240||0,disp500:l.disp500||0,dispMel:l.dispMel||0,data:l.data}))
      .sort((a,b)=>(a.data||"").localeCompare(b.data||""));
    
    for(const lote of lotesSrc){
      if(r40<=0&&r240<=0&&r500<=0&&rMel<=0)break;
      if(lote.isMel){
        if(rMel<=0)continue;
        const takeMel=Math.min(rMel,lote.dispMel);
        if(takeMel>0){
          alocs.push({lote_id:lote.lote_id,qtd_40:0,qtd_240:0,qtd_500:0,qtd_mel:takeMel});
          rMel-=takeMel;
        }
      }else{
        if(r40<=0&&r240<=0&&r500<=0)continue;
        const take40=Math.min(r40,lote.disp40);
        const take240=Math.min(r240,lote.disp240);
        const take500=Math.min(r500,lote.disp500);
        if(take40+take240+take500>0){
          alocs.push({lote_id:lote.lote_id,qtd_40:take40,qtd_240:take240,qtd_500:take500,qtd_mel:0});
          r40-=take40;r240-=take240;r500-=take500;
        }
      }
    }
    const falta={q40:Math.max(0,r40),q240:Math.max(0,r240),q500:Math.max(0,r500),qMel:Math.max(0,rMel)};
    return{alocs,falta};
  };

  // Grava as alocações no Supabase (remove antigas do pedido e insere novas)
  const gravarAlocacoes=async(pedido_num,alocs)=>{
    try{
      await fetch(`${SUPA_URL}/rest/v1/pedido_lotes?pedido_num=eq.${encodeURIComponent(pedido_num)}`,{method:"DELETE",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Prefer":"return=minimal"}});
      if(alocs.length>0){
        // Chaves uniformes (PostgREST exige): inclui qtd_mel sempre
        const payload=alocs.map(a=>({
          pedido_num,
          lote_id:a.lote_id,
          qtd_40:+a.qtd_40||0,
          qtd_240:+a.qtd_240||0,
          qtd_500:+a.qtd_500||0,
          qtd_mel:+a.qtd_mel||0,
          status:"confirmada",
          confirmada_em:new Date().toISOString()
        }));
        const r=await fetch(`${SUPA_URL}/rest/v1/pedido_lotes`,{method:"POST",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(payload)});
        if(!r.ok){const t=await r.text();console.error("[gravarAlocacoes] erro:",t);}
      }
    }catch(e){console.warn("[FIFO] gravarAlocacoes",e);}
  };

  // Retorna o lote principal (onde foi tirado a maior parte) pra exibir em pedidos.lote
  const loteDeAlocacoes=(alocs)=>{
    if(alocs.length===0)return null;
    if(alocs.length===1)return alocs[0].lote_id;
    // Múltiplos lotes — retorna "L001+L002" ou similar
    return alocs.map(a=>a.lote_id).join("+");
  };

  // ─── COMPUTED ───
  // Ingrediente consumido por lote = (kg embalado + sobra) × proporção
  // A sobra TAMBÉM consumiu ingrediente, só não virou produto embalado.
  const totalKgComSobra=useMemo(()=>lotes.reduce((s,l)=>s+(+l.kg||0)+(+l.sobra||0),0),[lotes]);
  const totalKg=useMemo(()=>lotes.reduce((s,l)=>s+(+l.kg||0),0),[lotes]);
  const ingEst=useMemo(()=>ing.map(i=>({...i,est:i.comprado-(totalKgComSobra*i.prop)})),[ing,totalKgComSobra]);
  // Custo unitário: granola = soma de ingredientes (proporção × preço/kg) + custo de embalagem
  // Mel = custo médio das compras (vem pronto, não tem ingredientes nem embalagem separada)
  const prodCusto=useMemo(()=>PRODUTOS.map(p=>{
    if(p.tipo==="mel"){
      // Custo médio ponderado das compras de mel
      const totalQtd=melCompras.reduce((s,c)=>s+(+c.qtd_potes||0),0);
      const totalCusto=melCompras.reduce((s,c)=>s+(+c.custo_total||0),0);
      const custoMedio=totalQtd>0?totalCusto/totalQtd:0;
      return{...p,custoIng:custoMedio,custoTotal:custoMedio,margem:p.preco>0?((p.preco-custoMedio)/p.preco*100):0};
    }
    const ci=ing.reduce((s,i)=>s+(p.peso/1000)*i.prop*i.precoKg,0);
    return{...p,custoIng:ci,custoTotal:ci+p.custoEmb,margem:((p.preco-(ci+p.custoEmb))/p.preco*100)};
  }),[ing,melCompras]);
  const stats=useMemo(()=>{
    const v=vendas.filter(x=>x.tipo==="Venda");
    const rec=v.reduce((s,x)=>s+x.rec,0);
    const luc=v.reduce((s,x)=>s+x.lucro,0);
    const custoTot=v.reduce((s,x)=>s+(+x.custo||0),0);
    const pacs40=vendas.reduce((s,x)=>s+(+x.q40||0),0);
    const pacs240=vendas.reduce((s,x)=>s+(+x.q240||0),0);
    const pacs500=vendas.reduce((s,x)=>s+(+x.q500||0),0);
    const pacsMel=vendas.reduce((s,x)=>s+(+x.qMel||0),0);
    const pacs=pacs40+pacs240+pacs500+pacsMel;
    // Granola total em kg (0.04*qtd40 + 0.24*qtd240 + 0.50*qtd500) — mel não conta como granola
    const kgTotal=(pacs40*0.04)+(pacs240*0.24)+(pacs500*0.5);
    // Hoje, semana, mês
    const hj=today();
    const d7=new Date();d7.setDate(d7.getDate()-7);const d7s=d7.toISOString().slice(0,10);
    const d30=new Date();d30.setDate(d30.getDate()-30);const d30s=d30.toISOString().slice(0,10);
    const vHoje=v.filter(x=>x.data===hj);
    const vSem=v.filter(x=>x.data>=d7s);
    const vMes=v.filter(x=>x.data>=d30s);
    // Média e ticket médio
    const ticketMedio=v.length>0?rec/v.length:0;
    const margem=rec>0?(luc/rec)*100:0;
    // Clientes únicos + novos do mês
    const clientesUnicos=new Set(vendas.filter(x=>x.comp!=="-").map(x=>x.comp.toLowerCase().trim())).size;
    const dataPrimeiroPorCliente={};
    v.forEach(x=>{const k=(x.comp||"").toLowerCase().trim();if(!dataPrimeiroPorCliente[k]||x.data<dataPrimeiroPorCliente[k])dataPrimeiroPorCliente[k]=x.data;});
    const novosMes=Object.values(dataPrimeiroPorCliente).filter(d=>d>=d30s).length;
    return{
      tot:v.length,
      rec,luc,custoTot,
      margem,
      ticketMedio,
      pend:vendas.filter(x=>!x.entreg).length,
      cli:clientesUnicos,
      novosMes,
      pacs,pacs40,pacs240,pacs500,
      kgTotal,
      hoje:{qtd:vHoje.length,rec:vHoje.reduce((s,x)=>s+x.rec,0)},
      sem:{qtd:vSem.length,rec:vSem.reduce((s,x)=>s+x.rec,0),luc:vSem.reduce((s,x)=>s+x.lucro,0)},
      mes:{qtd:vMes.length,rec:vMes.reduce((s,x)=>s+x.rec,0),luc:vMes.reduce((s,x)=>s+x.lucro,0)}
    };
  },[vendas]);
  
  // ─── DASHBOARD AVANÇADO: séries temporais, rankings, distribuições ───
  const dashboardData=useMemo(()=>{
    let v=vendas.filter(x=>x.tipo==="Venda");
    // Aplica filtros interativos
    if(dashFiltroMes)v=v.filter(x=>x.data&&x.data.startsWith(dashFiltroMes));
    if(dashFiltroSku){
      const skuKey=dashFiltroSku==="40g"?"q40":dashFiltroSku==="240g"?"q240":"q500";
      v=v.filter(x=>(+x[skuKey]||0)>0);
    }
    if(dashFiltroCanal)v=v.filter(x=>x.canal===dashFiltroCanal);
    
    // Série temporal por dia, baseado no período selecionado
    const hoje=new Date();
    const totalDias=dashPeriodo==="all"?365:dashPeriodo;
    const dias=[];
    for(let i=totalDias-1;i>=0;i--){
      const d=new Date(hoje);d.setDate(d.getDate()-i);
      const dStr=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      const vDia=v.filter(x=>x.data===dStr);
      dias.push({
        data:dStr,
        label:`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`,
        receita:vDia.reduce((s,x)=>s+(+x.rec||0),0),
        lucro:vDia.reduce((s,x)=>s+(+x.lucro||0),0),
        qtd:vDia.length
      });
    }
    
    // Top 10 clientes por receita
    const porCliente={};
    v.forEach(x=>{
      const k=(x.comp||"").toLowerCase().trim();
      if(!k||k==="-")return;
      if(!porCliente[k])porCliente[k]={nome:x.comp,receita:0,lucro:0,pedidos:0,pacs:0,_chave:k};
      porCliente[k].receita+=(+x.rec||0);
      porCliente[k].lucro+=(+x.lucro||0);
      porCliente[k].pedidos+=1;
      porCliente[k].pacs+=(+x.q40||0)+(+x.q240||0)+(+x.q500||0);
    });
    const topClientes=Object.values(porCliente).sort((a,b)=>b.receita-a.receita).slice(0,10);
    
    // Distribuição por SKU (% de receita)
    const recBySku={
      "40g":v.reduce((s,x)=>s+(+x.q40||0)*9.9,0),
      "240g":v.reduce((s,x)=>s+(+x.q240||0)*44.9,0),
      "500g":v.reduce((s,x)=>s+(+x.q500||0)*84.9,0),
      "Mel 300g":v.reduce((s,x)=>s+(+x.qMel||0)*39.99,0)
    };
    const totalSku=Object.values(recBySku).reduce((s,v)=>s+v,0);
    
    // Distribuição por canal
    const recByCanal={};
    v.forEach(x=>{
      const c=x.canal||"—";
      if(!recByCanal[c])recByCanal[c]=0;
      recByCanal[c]+=(+x.rec||0);
    });
    const totalCanal=Object.values(recByCanal).reduce((s,v)=>s+v,0);
    const canais=Object.entries(recByCanal).sort((a,b)=>b[1]-a[1]);
    
    // Distribuição por método de pagamento
    const porMetodo={};
    v.forEach(x=>{
      const m=x.met||"—";
      if(!porMetodo[m])porMetodo[m]=0;
      porMetodo[m]+=(+x.rec||0);
    });
    const metodos=Object.entries(porMetodo).sort((a,b)=>b[1]-a[1]);
    
    // Receita por mês — agrupa todas as vendas por ano-mes
    const porMes={};
    v.forEach(x=>{
      if(!x.data)return;
      const m=x.data.slice(0,7);  // YYYY-MM
      if(!porMes[m])porMes[m]={mes:m,receita:0,lucro:0,custo:0,qtd:0};
      porMes[m].receita+=(+x.rec||0);
      porMes[m].lucro+=(+x.lucro||0);
      porMes[m].custo+=(+x.custo||0);
      porMes[m].qtd+=1;
    });
    const mesesData=Object.values(porMes).sort((a,b)=>a.mes.localeCompare(b.mes));
    
    // Frequência de compras (clientes recorrentes vs únicos)
    const recorrentes=Object.values(porCliente).filter(c=>c.pedidos>=2).length;
    const unicos=Object.values(porCliente).filter(c=>c.pedidos===1).length;
    
    // Crescimento vs mês anterior
    const mesAtualNum=hoje.getMonth();
    const mesAtual=`${hoje.getFullYear()}-${String(mesAtualNum+1).padStart(2,"0")}`;
    const mesAnt=mesAtualNum===0?`${hoje.getFullYear()-1}-12`:`${hoje.getFullYear()}-${String(mesAtualNum).padStart(2,"0")}`;
    const recMesAtual=porMes[mesAtual]?.receita||0;
    const recMesAnt=porMes[mesAnt]?.receita||0;
    const crescimentoPct=recMesAnt>0?((recMesAtual-recMesAnt)/recMesAnt*100):0;
    
    return{
      dias,topClientes,recBySku,totalSku,canais,totalCanal,metodos,mesesData,recorrentes,unicos,
      recMesAtual,recMesAnt,crescimentoPct,
      // Indica se há filtros ativos pra mostrar badges
      filtrosAtivos:!!(dashFiltroMes||dashFiltroSku||dashFiltroCanal),
      vendas:v  // exposto pra outros usos
    };
  },[vendas,dashPeriodo,dashFiltroMes,dashFiltroSku,dashFiltroCanal]);
  
  // ─── REEMBOLSOS (nova versão — baseada em custo_pagamentos) ───
  // Cada pagador tem lista de pendências e histórico quitado
  const reembPorPagador=useMemo(()=>{
    const m={};
    custoPagamentos.forEach(p=>{
      if(!p.pagador||p.pagador==="Kroc")return;
      if(!m[p.pagador])m[p.pagador]={pagador:p.pagador,pendentes:[],quitados:[],totalPend:0,totalQuit:0};
      const custo=custos.find(c=>c._supaId===p.custoId);
      const item={
        cpId:p._supaId,
        custoId:p.custoId,
        desp:custo?.desp||"—",
        data:custo?.data||"",
        valorPago:p.valorPago,
        pendente:p.reembPendente,
        quitado:p.reembQuitado,
        quitadoEm:p.quitadoEm,
      };
      if(p.reembPendente>0){m[p.pagador].pendentes.push(item);m[p.pagador].totalPend+=p.reembPendente;}
      if(p.reembQuitado>0){m[p.pagador].quitados.push(item);m[p.pagador].totalQuit+=p.reembQuitado;}
    });
    // Ordena pendências por data (mais recentes primeiro)
    Object.values(m).forEach(o=>{
      o.pendentes.sort((a,b)=>(b.data||"").localeCompare(a.data||""));
      o.quitados.sort((a,b)=>(b.quitadoEm||"").localeCompare(a.quitadoEm||""));
    });
    return Object.values(m).sort((a,b)=>b.totalPend-a.totalPend);
  },[custoPagamentos,custos]);

  // Compat: mantém o "reemb" antigo (array simples) usado em algum outro lugar
  const reemb=useMemo(()=>reembPorPagador.filter(r=>r.totalPend>0).map(r=>({p:r.pagador,t:r.totalPend})),[reembPorPagador]);

  // ─── ESTOQUE: disponível por lote = produzido - alocado (FIFO) - baixas ───
  // Suporta granolas (40/240/500g) e mel (300g, lotes MEL-XXX)
  const lotesCalc=useMemo(()=>{
    try{
      return lotes.map(l=>{
        try{
          const isMel=(l.tipo==="mel")||String(l.id||"").startsWith("MEL-");
          // Fonte 1: alocações FIFO (pedidoLotes não-baixa)
          const alocs=pedidoLotes.filter(pl=>pl&&pl.lote_id===l.id&&!String(pl.pedido_num||"").startsWith("BX-"));
          const aloc40=alocs.reduce((s,pl)=>s+(+pl.qtd_40||0),0);
          const aloc240=alocs.reduce((s,pl)=>s+(+pl.qtd_240||0),0);
          const aloc500=alocs.reduce((s,pl)=>s+(+pl.qtd_500||0),0);
          const alocMel=alocs.reduce((s,pl)=>s+(+pl.qtd_mel||0),0);
          
          // Fonte 2 (redundância legacy): vendas com lote definido não em pedidoLotes
          const pedidoNumsAlocados=new Set(alocs.map(a=>a.pedido_num));
          const vendasDoLote=vendas.filter(v=>v.lote===l.id&&!pedidoNumsAlocados.has(v.id));
          const vend40=vendasDoLote.reduce((s,v)=>s+(+v.q40||0),0);
          const vend240=vendasDoLote.reduce((s,v)=>s+(+v.q240||0),0);
          const vend500=vendasDoLote.reduce((s,v)=>s+(+v.q500||0),0);
          const vendMel=vendasDoLote.reduce((s,v)=>s+(+v.qMel||0),0);
          
          const ped={q40:aloc40+vend40,q240:aloc240+vend240,q500:aloc500+vend500,qMel:alocMel+vendMel};
          
          // Baixas: 2 fontes
          const baixaAllocs=pedidoLotes.filter(pl=>pl&&pl.lote_id===l.id&&String(pl.pedido_num||"").startsWith("BX-"));
          const bxAlloc40=baixaAllocs.reduce((s,pl)=>s+(+pl.qtd_40||0),0);
          const bxAlloc240=baixaAllocs.reduce((s,pl)=>s+(+pl.qtd_240||0),0);
          const bxAlloc500=baixaAllocs.reduce((s,pl)=>s+(+pl.qtd_500||0),0);
          const bxAllocMel=baixaAllocs.reduce((s,pl)=>s+(+pl.qtd_mel||0),0);
          
          const baixaDoLote=baixas.filter(b=>b&&b.lote===l.id);
          const bxRaw40=baixaDoLote.reduce((s,b)=>s+(+b.q40||+b.qtd_40||0),0);
          const bxRaw240=baixaDoLote.reduce((s,b)=>s+(+b.q240||+b.qtd_240||0),0);
          const bxRaw500=baixaDoLote.reduce((s,b)=>s+(+b.q500||+b.qtd_500||0),0);
          const bxRawMel=baixaDoLote.reduce((s,b)=>s+(+b.qMel||+b.qtd_mel||0),0);
          
          const bxd={
            q40:Math.max(bxAlloc40,bxRaw40),
            q240:Math.max(bxAlloc240,bxRaw240),
            q500:Math.max(bxAlloc500,bxRaw500),
            qMel:Math.max(bxAllocMel,bxRawMel)
          };
          
          const disp40=Math.max(0,(+l.p40||0)-ped.q40-bxd.q40);
          const disp240=Math.max(0,(+l.p240||0)-ped.q240-bxd.q240);
          const disp500=Math.max(0,(+l.p500||0)-ped.q500-bxd.q500);
          const dispMel=Math.max(0,(+l.pMel||0)-ped.qMel-bxd.qMel);
          
          // Validade — mel = 365 dias, granola = 45 dias
          let dias=999;
          try{
            const dtParsed=parseDate(l.data);
            const tParsed=dtParsed&&typeof dtParsed.getTime==="function"?dtParsed.getTime():0;
            if(tParsed>0){
              const validadeDias=isMel?365:45;
              dias=Math.ceil((tParsed+validadeDias*864e5-Date.now())/864e5);
            }
          }catch(e){dias=999}
          const status=dias<0?"Vencido":dias<=7?"Vence em breve":"OK";
          return{...l,isMel,ped,bxd,disp40,disp240,disp500,dispMel,dias,status};
        }catch(e){
          console.warn("[lotesCalc] erro num lote:",l?.id,e);
          return{...l,isMel:false,ped:{q40:0,q240:0,q500:0,qMel:0},bxd:{q40:0,q240:0,q500:0,qMel:0},disp40:0,disp240:0,disp500:0,dispMel:0,dias:999,status:"OK"};
        }
      });
    }catch(e){
      console.error("[lotesCalc] erro fatal:",e);
      return[];
    }
  },[lotes,pedidoLotes,vendas,baixas]);

  // ─── CONSUMO AUTOMÁTICO DE EMBALAGENS ───
  // Regra: toda saída física de produto consome 1 embalagem de cada tamanho + 1 adesivo.
  // Sacola só em entregas delivery (canal que requer sacola).
  //
  // ATENÇÃO: evita dupla contagem. Amostras podem ser registradas em 2 lugares:
  //   - vendas (tipo="Amostra"/"Cortesia")
  //   - baixas (categoria="Amostra"/"Marketing"/"Cortesia")
  // Só conta UM dos dois pra cada unidade.
  const consumoEmb=useMemo(()=>{
    let c40=0,c240=0,c500=0,sacolas=0;
    // Vendas (inclui Venda + Amostra + Cortesia registradas como pedido)
    vendas.forEach(v=>{
      c40+=v.q40||0;c240+=v.q240||0;c500+=v.q500||0;
      // Sacola só em canais que exigem entrega empacotada
      const canaisComSacola=["Online","WhatsApp","Feira"];
      if(canaisComSacola.includes(v.canal))sacolas+=1;
    });
    // Baixas: só conta se NÃO foi já contado como venda.
    // A baixa tem _supaId, então olha se a alocação dela foi criada como venda também.
    // Abordagem segura: ignora baixas que têm pedido_num linkado a uma venda existente.
    baixas.forEach(b=>{
      // Se a baixa veio de uma alocação com pedido_num BX-*, ela é independente da venda
      // Se veio de uma alocação com pedido_num P*, já foi contada
      c40+=b.q40||0;c240+=b.q240||0;c500+=b.q500||0;
    });
    return{c40,c240,c500,sacolas};
  },[vendas,baixas]);

  // Diagnóstico de consumo — facilita conferir se está coerente
  const consumoDebug=useMemo(()=>{
    const vendaQ={q40:vendas.reduce((s,v)=>s+(v.q40||0),0),q240:vendas.reduce((s,v)=>s+(v.q240||0),0),q500:vendas.reduce((s,v)=>s+(v.q500||0),0),qMel:vendas.reduce((s,v)=>s+(v.qMel||0),0)};
    const baixaQ={q40:baixas.reduce((s,b)=>s+(b.q40||0),0),q240:baixas.reduce((s,b)=>s+(b.q240||0),0),q500:baixas.reduce((s,b)=>s+(b.q500||0),0),qMel:baixas.reduce((s,b)=>s+(b.qMel||0),0)};
    const produzidoQ={q40:lotes.reduce((s,l)=>s+(l.p40||0),0),q240:lotes.reduce((s,l)=>s+(l.p240||0),0),q500:lotes.reduce((s,l)=>s+(l.p500||0),0),qMel:lotes.reduce((s,l)=>s+(l.pMel||0),0)};
    return{
      produzido:produzidoQ,
      vendas:vendaQ,
      baixas:baixaQ,
      consumoTotal:{q40:vendaQ.q40+baixaQ.q40,q240:vendaQ.q240+baixaQ.q240,q500:vendaQ.q500+baixaQ.q500,qMel:vendaQ.qMel+baixaQ.qMel},
      discrepancia:{
        q40:produzidoQ.q40-vendaQ.q40-baixaQ.q40,
        q240:produzidoQ.q240-vendaQ.q240-baixaQ.q240,
        q500:produzidoQ.q500-vendaQ.q500-baixaQ.q500,
        qMel:produzidoQ.qMel-vendaQ.qMel-baixaQ.qMel,
      }
    };
  },[vendas,baixas,lotes]);

  // Embalagens com uso calculado automaticamente
  const embCalc=useMemo(()=>{
    return emb.map(e=>{
      let usadoCalc=e.usado;
      if(e.nome==="Pacote 40g"||e.nome==="Adesivo 40g")usadoCalc=consumoEmb.c40;
      else if(e.nome==="Pacote 240g"||e.nome==="Adesivo 240g")usadoCalc=consumoEmb.c240;
      else if(e.nome==="Pacote 500g"||e.nome==="Adesivo 500g")usadoCalc=consumoEmb.c500;
      else if(e.nome==="Sacola Entrega")usadoCalc=consumoEmb.sacolas;
      return{...e,usado:usadoCalc,disp:e.comprado-usadoCalc};
    });
  },[emb,consumoEmb]);

  // ─── ESTOQUE TOTAL DISPONÍVEL (soma de todos os lotes ativos) ───
  const estoqueTotal=useMemo(()=>{
    const ativos=lotesCalc.filter(l=>l.dias>0);
    return{
      d40:ativos.reduce((s,l)=>s+Math.max(0,l.disp40),0),
      d240:ativos.reduce((s,l)=>s+Math.max(0,l.disp240),0),
      d500:ativos.reduce((s,l)=>s+Math.max(0,l.disp500),0),
      dMel:ativos.reduce((s,l)=>s+Math.max(0,l.dispMel||0),0)
    };
  },[lotesCalc]);

  // ─── PENDÊNCIAS: vendas que precisam produção ───
  // Regra ABSOLUTA: nenhum pedido entregue pode ficar sem alocação.
  // Então:
  //   - Pedido NÃO entregue com falta de alocação → pendência normal (🔶 reservada parcial)
  //   - Pedido ENTREGUE com falta de alocação → pendência CRÍTICA (⚠️ produção atrasada — 
  //     cliente já recebeu, mas o estoque que foi dado a ele era reservado pra outro, 
  //     ou nem havia estoque)
  //
  // Não pendente:
  //   - Tipo ≠ Venda (amostras/cortesias não contam)
  //   - Não entregue E prod=true (você já separou, só não entregou ainda)
  //   - Não entregue E totalmente alocado (já tem estoque reservado)
  const pendProducao=useMemo(()=>{
    return vendas.filter(v=>{
      if(v.tipo!=="Venda")return false;
      // Não entregue + já produzido + sem falta = OK, não é pendência
      return true;
    }).map(v=>{
      const alocsDoPedido=(pedidoLotes||[]).filter(pl=>pl.pedido_num===v.id);
      const aloc40=alocsDoPedido.reduce((s,a)=>s+(+a.qtd_40||0),0);
      const aloc240=alocsDoPedido.reduce((s,a)=>s+(+a.qtd_240||0),0);
      const aloc500=alocsDoPedido.reduce((s,a)=>s+(+a.qtd_500||0),0);
      const falta40Qtd=Math.max(0,(+v.q40||0)-aloc40);
      const falta240Qtd=Math.max(0,(+v.q240||0)-aloc240);
      const falta500Qtd=Math.max(0,(+v.q500||0)-aloc500);
      const falta40=falta40Qtd>0;
      const falta240=falta240Qtd>0;
      const falta500=falta500Qtd>0;
      const temFalta=falta40||falta240||falta500;
      // Classifica o tipo de pendência
      const critica=v.entreg&&temFalta;  // entregue mas sem alocação → gravíssimo
      return{...v,falta40,falta240,falta500,falta40Qtd,falta240Qtd,falta500Qtd,aloc40,aloc240,aloc500,temFalta,critica};
    }).filter(v=>{
      // Inclui só quem tem falta E (não está entregue OU está entregue MAS com falta de aloc)
      if(!v.temFalta)return false;
      if(v.entreg)return true; // crítico — entregue sem alocação
      if(v.prod)return false;  // já produzido mas não entregue = ok
      return true;
    }).sort((a,b)=>{
      // Críticas primeiro (entregues sem aloc)
      if(a.critica&&!b.critica)return -1;
      if(!a.critica&&b.critica)return 1;
      // Depois, mais antigos primeiro
      return (a.data||"").localeCompare(b.data||"");
    });
  },[vendas,pedidoLotes]);

  // Totais agregados: soma apenas o que FALTA de cada pedido pendente
  const pendProducaoTotais=useMemo(()=>{
    return pendProducao.reduce((acc,v)=>({
      prod40:acc.prod40+v.falta40Qtd,
      prod240:acc.prod240+v.falta240Qtd,
      prod500:acc.prod500+v.falta500Qtd,
      totalPedidos:acc.totalPedidos+1
    }),{prod40:0,prod240:0,prod500:0,totalPedidos:0});
  },[pendProducao]);

  // ─── LOGBOOK GERAL (página unificada) — states ANTES dos useMemo ───
  const[estoqueView,setEstoqueView]=useState("estoque"); // "estoque" | "logbook" | "compras"
  const[levaExpandida,setLevaExpandida]=useState(null);
  const[lbFiltroSku,setLbFiltroSku]=useState("todos");
  const[lbFiltroLote,setLbFiltroLote]=useState("todos");
  const[lbFiltroDestino,setLbFiltroDestino]=useState("todos");
  const[lbBusca,setLbBusca]=useState("");
  const[lbOrdem,setLbOrdem]=useState("recente"); // recente / antigo / lote / sku
  // Unidades com hash, carregadas do Supabase
  const[unidadesDb,setUnidadesDb]=useState([]);
  const fetchUnidades=useCallback(async()=>{
    try{
      const r=await fetch(`${SUPA_URL}/rest/v1/unidades?select=*&order=created_at.desc&limit=10000`,{headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`}});
      const arr=await r.json();
      if(Array.isArray(arr))setUnidadesDb(arr);
    }catch(e){console.warn("[unidades] erro:",e);}
  },[]);
  useEffect(()=>{if(user)fetchUnidades()},[user]);

  // Helper central: popular unidades + realocar + sync + fetch unidades
  // Use este em vez de sync() quando mudar algo que afete alocação
  const reconciliar=useCallback(async()=>{
    await popularUnidades();
    await realocarTudo();
    await sync();
    await fetchUnidades();
  },[popularUnidades,realocarTudo,sync,fetchUnidades]);

  // ─── LOGBOOK: expansão de cada unidade produzida em 1 linha ───
  // Cada unidade produzida vira uma linha; se foi alocada vira destino "venda" ou "baixa"; se não, "estoque"
  const logbookUnidades=useMemo(()=>{
    const linhas=[];
    let seq=1;
    if(!Array.isArray(lotes)||lotes.length===0)return linhas;
    // Index unidades do banco por (lote_id, sku, seq_no_lote) pra lookup rápido
    const unidadesMap={};
    unidadesDb.forEach(u=>{
      const k=`${u.lote_id}|${u.sku}|${u.seq_no_lote}`;
      unidadesMap[k]=u.id;
    });
    // Itera lotes na ordem cronológica (mais antigo primeiro)
    [...lotes].sort((a,b)=>(a.data||"").localeCompare(b.data||"")).forEach(l=>{
      if(!l||!l.id)return;
      // Alocações desse lote (vendas/baixas)
      const alocs=(pedidoLotes||[]).filter(pl=>pl&&pl.lote_id===l.id);
      // Para cada SKU, lista unidades produzidas
      // SKUs: 40, 240, 500 (granola) + mel (compra de revenda)
      // Cada SKU tem uma chave de qtd no lote (p40/p240/p500/pMel) e em alocações (qtd_40/qtd_240/qtd_500/qtd_mel)
      const skuConfig=[
        {sku:"40",qtdLoteKey:"p40",qtdAlocKey:"qtd_40",label:"40g"},
        {sku:"240",qtdLoteKey:"p240",qtdAlocKey:"qtd_240",label:"240g"},
        {sku:"500",qtdLoteKey:"p500",qtdAlocKey:"qtd_500",label:"500g"},
        {sku:"mel",qtdLoteKey:"pMel",qtdAlocKey:"qtd_mel",label:"Mel 300g"}
      ];
      skuConfig.forEach(({sku,qtdLoteKey,qtdAlocKey,label})=>{
        const qtdProd=parseInt(l[qtdLoteKey])||0;
        if(qtdProd<=0)return;
        // Alocações desse SKU expandidas em unidades individuais
        const saidas=[];
        alocs.filter(a=>(a[qtdAlocKey]||0)>0).sort((a,b)=>(a.created_at||"").localeCompare(b.created_at||"")).forEach(a=>{
          const qtd=parseInt(a[qtdAlocKey])||0;
          const pedidoNum=a.pedido_num||"";
          const isBaixa=typeof pedidoNum==="string"&&pedidoNum.startsWith("BX-");
          const venda=!isBaixa?vendas.find(v=>v.id===pedidoNum):null;
          const baixa=isBaixa?baixas.find(b=>b&&(`BX-${b._supaId}`===pedidoNum||`BX-${b.id}`===pedidoNum)):null;
          const statusAloc=a.status||(venda&&venda.entreg?"confirmada":"preliminar");
          for(let i=0;i<qtd;i++){
            saidas.push({
              destino:isBaixa?"baixa":"venda",
              pedido:pedidoNum,
              cliente:venda?venda.comp:(baixa?baixa.motivo:"—"),
              dataDest:venda?venda.data:(baixa?baixa.data:a.created_at),
              venda,baixa,
              alocId:a.id,
              statusAloc
            });
          }
        });
        // Completa com "em estoque" até bater qtdProd
        for(let i=0;i<qtdProd;i++){
          const saida=saidas[i];
          const unidadeId=unidadesMap[`${l.id}|${sku}|${i+1}`]||null;
          linhas.push({
            seq:seq++,
            unidadeId,
            sku:label,
            lote_id:l.id,
            lote_data:l.data,
            unidadeNoLote:i+1,
            destino:saida?saida.destino:"estoque",
            pedido:saida?saida.pedido:null,
            cliente:saida?saida.cliente:null,
            dataDest:saida?saida.dataDest:null,
            venda:saida?saida.venda:null,
            baixa:saida?saida.baixa:null,
            statusAloc:saida?saida.statusAloc:null
          });
        }
      });
    });
    return linhas;
  },[lotes,pedidoLotes,vendas,baixas,unidadesDb]);

  // Logbook filtrado + ordenado
  const logbookFiltrado=useMemo(()=>{
    const busca=lbBusca.trim().toLowerCase();
    const filt=logbookUnidades.filter(u=>{
      if(lbFiltroSku!=="todos"&&u.sku!==lbFiltroSku)return false;
      if(lbFiltroLote!=="todos"&&u.lote_id!==lbFiltroLote)return false;
      if(lbFiltroDestino!=="todos"&&u.destino!==lbFiltroDestino)return false;
      if(busca){
        const txt=[u.pedido,u.cliente,u.lote_id,u.sku,u.unidadeId].filter(Boolean).join(" ").toLowerCase();
        if(!txt.includes(busca))return false;
      }
      return true;
    });
    // Ordenação
    if(lbOrdem==="recente"){
      // Mais recente primeiro = maior lote_data, depois maior unidadeNoLote
      filt.sort((a,b)=>{
        const dataCmp=(b.lote_data||"").localeCompare(a.lote_data||"");
        if(dataCmp!==0)return dataCmp;
        if((b.lote_id||"")!==(a.lote_id||""))return (b.lote_id||"").localeCompare(a.lote_id||"");
        return (b.unidadeNoLote||0)-(a.unidadeNoLote||0);
      });
    }else if(lbOrdem==="antigo"){
      // Mais antigo primeiro (comportamento original)
      filt.sort((a,b)=>{
        const dataCmp=(a.lote_data||"").localeCompare(b.lote_data||"");
        if(dataCmp!==0)return dataCmp;
        if((a.lote_id||"")!==(b.lote_id||""))return (a.lote_id||"").localeCompare(b.lote_id||"");
        return (a.unidadeNoLote||0)-(b.unidadeNoLote||0);
      });
    }else if(lbOrdem==="lote"){
      filt.sort((a,b)=>(a.lote_id||"").localeCompare(b.lote_id||""));
    }else if(lbOrdem==="sku"){
      filt.sort((a,b)=>(a.sku||"").localeCompare(b.sku||""));
    }else if(lbOrdem==="destino"){
      // estoque → venda → baixa
      const ord={estoque:0,venda:1,baixa:2};
      filt.sort((a,b)=>(ord[a.destino]||99)-(ord[b.destino]||99));
    }
    return filt;
  },[logbookUnidades,lbFiltroSku,lbFiltroLote,lbFiltroDestino,lbBusca,lbOrdem]);

  // Cor de fundo por lote (determinística)
  const corLote=useMemo(()=>{
    const palette=[
      {bg:"#FEF3C7",border:"#F59E0B"},
      {bg:"#DBEAFE",border:"#2563EB"},
      {bg:"#F3E8FF",border:"#9333EA"},
      {bg:"#DCFCE7",border:"#16A34A"},
      {bg:"#FCE7F3",border:"#DB2777"},
      {bg:"#E0E7FF",border:"#4F46E5"},
      {bg:"#FED7AA",border:"#EA580C"},
      {bg:"#CFFAFE",border:"#0891B2"},
    ];
    const map={};
    lotes.forEach((l,i)=>{map[l.id]=palette[i%palette.length];});
    return map;
  },[lotes]);

  // ─── CLIENTES: computado a partir das vendas ───
  // Normaliza telefone: tira tudo que não é dígito
  const telDigits=(t)=>(t||"").toString().replace(/\D/g,"");
  // Formata telefone BR: (11) 99999-8888
  const fmtTel=(t)=>{
    const d=telDigits(t);
    if(!d)return "";
    // Remove código do país 55 se tiver (13 dígitos começando com 55)
    const clean=d.length>=13&&d.startsWith("55")?d.slice(2):d;
    if(clean.length===11)return `(${clean.slice(0,2)}) ${clean.slice(2,7)}-${clean.slice(7)}`;
    if(clean.length===10)return `(${clean.slice(0,2)}) ${clean.slice(2,6)}-${clean.slice(6)}`;
    return clean;
  };

  // ─── CLIENTES: fonte primária = tabela clientes do Supabase
  //                + agregações calculadas a partir de vendas (métricas)
  const[clientesDb,setClientesDb]=useState([]);
  const[clientesDbLoaded,setClientesDbLoaded]=useState(false);
  const fetchClientes=useCallback(async()=>{
    try{
      const r=await fetch(`${SUPA_URL}/rest/v1/clientes?select=*&order=codigo.asc`,{headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`}});
      const arr=await r.json();
      if(Array.isArray(arr))setClientesDb(arr);
      setClientesDbLoaded(true);
    }catch(e){console.warn("[clientes] fetch erro:",e);setClientesDbLoaded(true);}
  },[]);
  useEffect(()=>{if(user)fetchClientes()},[user]);

  const clientes=useMemo(()=>{
    // Helpers de normalização pra matching robusto
    // Telefones podem vir: "+55 11 99765-0045" ou "11997650045" ou "(11)99765-0045"
    // Normaliza: só dígitos, remove 55 do início se for 13 dígitos
    const telKey=(t)=>{
      const d=(t||"").toString().replace(/\D/g,"");
      if(!d)return "";
      // Remove código do país se tem 13 dígitos começando com 55
      if(d.length>=13&&d.startsWith("55"))return d.slice(2);
      // Também remove se tem 12 dígitos começando com 55 (fixo)
      if(d.length===12&&d.startsWith("55"))return d.slice(2);
      return d;
    };
    // Nome: lowercase, trim, remove acentos, colapsa espaços
    const nomeKey=(n)=>(n||"").toString().toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ");
    // Email: lowercase, trim
    const emailKey=(e)=>(e||"").toString().toLowerCase().trim();
    
    // Agrega métricas das vendas indexando em 3 mapas (email, tel, nome)
    const agregMap={};
    const agregPorEmail={};
    const agregPorTel={};
    const agregPorNome={};
    
    vendas.filter(v=>v.comp&&v.comp!=="-").forEach(v=>{
      const addr=ga(v.comp);
      const email=emailKey(v._email||addr.email||"");
      const tel=telKey(v._tel||addr.tel);
      const nome=nomeKey(v.comp);
      // Busca agregação existente por QUALQUER chave (pra evitar duplicação quando venda 1 tem só tel e venda 2 tem tel+email)
      let o=null;
      if(email&&agregPorEmail[email])o=agregPorEmail[email];
      else if(tel&&agregPorTel[tel])o=agregPorTel[tel];
      else if(nome&&agregPorNome[nome])o=agregPorNome[nome];
      if(!o){
        const key=email||tel||nome;
        o={
          nome:v.comp,q40:0,q240:0,q500:0,compras:0,total:0,lucro:0,
          tel:tel||telDigits(addr.tel),
          end:addr.rua||v._rua||"",
          numero:v._num||"",
          comp_end:addr.comp||v._comp||"",
          bairro:v._bairro||"",cep:v._cep||"",
          email:email||"",
          primeiraCompra:v.data,ultimaCompra:v.data,
          primeiroPedido:v.id,
          _key:key
        };
        agregMap[key]=o;
      }
      o.q40+=v.q40;o.q240+=v.q240;o.q500+=v.q500;
      o.compras+=1;o.total+=v.rec;o.lucro+=v.lucro;
      if(v.data<o.primeiraCompra){o.primeiraCompra=v.data;o.primeiroPedido=v.id;}
      if(v.data>o.ultimaCompra)o.ultimaCompra=v.data;
      if(!o.tel&&tel)o.tel=tel;
      if(!o.email&&email)o.email=email;
      if(!o.end&&(addr.rua||v._rua))o.end=addr.rua||v._rua;
      if(!o.numero&&v._num)o.numero=v._num;
      if(!o.bairro&&v._bairro)o.bairro=v._bairro;
      if(!o.cep&&v._cep)o.cep=v._cep;
      // (Re-)indexa em todas as chaves que agora existem pra essa agregação
      if(o.email)agregPorEmail[o.email]=o;
      if(o.tel)agregPorTel[o.tel]=o;
      if(o.nome)agregPorNome[nomeKey(o.nome)]=o;
    });
    
    const usados=new Set();  // _key das agregações já consumidas por clientes do banco
    
    // Pra cada cliente no banco, encontra agregação correspondente
    const resultado=clientesDb.map(db=>{
      const eK=emailKey(db.email);
      const tK=telKey(db.telefone);
      const nK=nomeKey(db.nome);
      
      let agreg=null;
      if(eK&&agregPorEmail[eK])agreg=agregPorEmail[eK];
      else if(tK&&agregPorTel[tK])agreg=agregPorTel[tK];
      else if(nK&&agregPorNome[nK])agreg=agregPorNome[nK];
      
      if(agreg)usados.add(agreg._key);
      
      return{
        _supaId:db.id,
        codigo:db.codigo||"—",
        nome:db.nome,
        email:db.email||(agreg?agreg.email:""),
        tel:db.telefone||(agreg?agreg.tel:""),
        end:db.rua||db.endereco||(agreg?agreg.end:""),  // endereco é a coluna antiga
        numero:db.numero||(agreg?agreg.numero:""),
        comp_end:db.complemento||(agreg?agreg.comp_end:""),
        bairro:db.bairro||(agreg?agreg.bairro:""),
        cidade:db.cidade||"São Paulo",
        estado:db.estado||"SP",
        cep:db.cep||(agreg?agreg.cep:""),
        obs:db.observacoes||"",
        primeiraCompra:db.primeira_compra||(agreg?agreg.primeiraCompra:null),
        ultimaCompra:db.ultima_compra||(agreg?agreg.ultimaCompra:null),
        q40:agreg?agreg.q40:0,q240:agreg?agreg.q240:0,q500:agreg?agreg.q500:0,
        compras:agreg?agreg.compras:0,
        total:agreg?agreg.total:0,
        lucro:agreg?agreg.lucro:0
      };
    });
    
    // Clientes só-nas-vendas (não bateram com nenhum do banco) aparecem como pendentes
    if(clientesDbLoaded){
      Object.values(agregMap).forEach(agreg=>{
        if(!usados.has(agreg._key)){
          resultado.push({
            codigo:"—",
            nome:agreg.nome,
            email:agreg.email,
            tel:agreg.tel,
            end:agreg.end,
            numero:agreg.numero,
            comp_end:agreg.comp_end,
            bairro:agreg.bairro,
            cep:agreg.cep,
            primeiraCompra:agreg.primeiraCompra,
            ultimaCompra:agreg.ultimaCompra,
            q40:agreg.q40,q240:agreg.q240,q500:agreg.q500,
            compras:agreg.compras,total:agreg.total,lucro:agreg.lucro,
            _orfao:true
          });
        }
      });
    }
    
    return resultado;
  },[clientesDb,clientesDbLoaded,vendas]);

  // Ordenação dos clientes (estado controlado pela UI)
  const[clientesSort,setClientesSort]=useState("codigo_asc");
  const clientesOrdenados=useMemo(()=>{
    const arr=[...clientes];
    switch(clientesSort){
      case "codigo_asc":return arr.sort((a,b)=>(a.codigo||"").localeCompare(b.codigo||""));
      case "codigo_desc":return arr.sort((a,b)=>(b.codigo||"").localeCompare(a.codigo||""));
      case "nome_asc":return arr.sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR"));
      case "nome_desc":return arr.sort((a,b)=>b.nome.localeCompare(a.nome,"pt-BR"));
      case "compras_desc":return arr.sort((a,b)=>b.compras-a.compras||b.total-a.total);
      case "total_desc":return arr.sort((a,b)=>b.total-a.total);
      case "lucro_desc":return arr.sort((a,b)=>b.lucro-a.lucro);
      case "ultimaCompra_desc":return arr.sort((a,b)=>{
        const auc=a.ultimaCompra||a.primeiraCompra||"";
        const buc=b.ultimaCompra||b.primeiraCompra||"";
        if(auc!==buc)return buc.localeCompare(auc);
        return (b.primeiroPedido||"").localeCompare(a.primeiroPedido||"");
      });
      case "primeiraCompra_asc":return arr.sort((a,b)=>{
        const apc=a.primeiraCompra||"";
        const bpc=b.primeiraCompra||"";
        if(apc!==bpc)return apc.localeCompare(bpc);
        return (a.primeiroPedido||"").localeCompare(b.primeiroPedido||"");
      });
      default:return arr;
    }
  },[clientes,clientesSort]);

  // ─── CUPONS (Supabase) ───
  const[cupons,setCupons]=useState([]);
  const[cuponsUso,setCuponsUso]=useState([]);
  const[cuponsLoading,setCuponsLoading]=useState(false);
  // Feature flags
  const[featureFlags,setFeatureFlags]=useState([]);
  // ─── FRETE CONFIG ───
  const[freteConfig,setFreteConfig]=useState(null);
  const[freteConfigLoading,setFreteConfigLoading]=useState(false);
  const[freteConfigGeocoding,setFreteConfigGeocoding]=useState(false);
  const fetchFreteConfig=async()=>{
    try{
      const r=await fetch(`${SUPA_URL}/rest/v1/frete_config?select=*&id=eq.1`,{headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`}});
      const arr=await r.json();
      if(Array.isArray(arr)&&arr[0])setFreteConfig(arr[0]);
    }catch(e){console.error("fetch frete_config:",e);}
  };
  const saveFreteConfig=async(patch)=>{
    if(!freteConfig)return;
    setFreteConfigLoading(true);
    try{
      const body={...patch,updated_at:new Date().toISOString(),updated_by:(user?.email||"admin")};
      await fetch(`${SUPA_URL}/rest/v1/frete_config?id=eq.1`,{method:"PATCH",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(body)});
      setFreteConfig(v=>({...v,...body}));
      show("💾 Frete atualizado");
    }catch(e){show("❌ Erro ao salvar");}
    setFreteConfigLoading(false);
  };
  const geocodeEndereco=async(endereco)=>{
    if(!endereco)return null;
    setFreteConfigGeocoding(true);
    try{
      // Extrai CEP do input (se tiver)
      const cepMatch=endereco.match(/\b(\d{5})-?(\d{3})\b/);
      
      // Estratégia 1: se tiver CEP, usa ViaCEP pra pegar endereço estruturado
      let baseAddr=endereco;
      if(cepMatch){
        const cep=cepMatch[1]+cepMatch[2];
        try{
          const vc=await fetch(`https://viacep.com.br/ws/${cep}/json/`);
          const vd=await vc.json();
          if(vd&&!vd.erro){
            // Se tem número no input, inclui
            const numMatch=endereco.match(/\b(\d+)\b/);
            const num=numMatch&&numMatch[1]!==cep.slice(0,5)?numMatch[1]:"";
            baseAddr=[vd.logradouro,num,vd.bairro,vd.localidade,vd.uf,"Brasil"].filter(Boolean).join(", ");
          }
        }catch(e){}
      }
      
      // Estratégia 2: Nominatim structured query (mais preciso que free-form)
      // Tenta parsear algum padrão "Rua X, 123, Bairro Y, Cidade Z"
      const parts=endereco.split(",").map(s=>s.trim()).filter(Boolean);
      let url;
      if(parts.length>=3&&!cepMatch){
        // Assume estrutura: rua+numero, bairro, cidade[, estado, cep]
        const street=parts[0];
        const city=parts[parts.length>=4?2:1]||"São Paulo";
        const state=parts.find(p=>/^[A-Z]{2}$/.test(p.trim()))||"SP";
        url=`https://nominatim.openstreetmap.org/search?format=json&limit=3&countrycodes=br&addressdetails=1&street=${encodeURIComponent(street)}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`;
      }else{
        url=`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(baseAddr)}&format=json&limit=3&countrycodes=br&addressdetails=1`;
      }
      const r=await fetch(url,{headers:{"Accept-Language":"pt-BR"}});
      const arr=await r.json();
      
      // Estratégia 3: se ainda não achou, free-form
      if((!arr||arr.length===0)&&baseAddr!==endereco){
        const r2=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(baseAddr)}&format=json&limit=3&countrycodes=br`,{headers:{"Accept-Language":"pt-BR"}});
        const arr2=await r2.json();
        if(arr2&&arr2[0]){
          setFreteConfigGeocoding(false);
          return{lat:+arr2[0].lat,lng:+arr2[0].lon,displayName:arr2[0].display_name};
        }
      }
      
      setFreteConfigGeocoding(false);
      if(arr&&arr[0])return{lat:+arr[0].lat,lng:+arr[0].lon,displayName:arr[0].display_name};
    }catch(e){setFreteConfigGeocoding(false);console.warn("[geocode]",e);}
    return null;
  };
  const fetchFlags=useCallback(async()=>{
    try{
      const r=await fetch(`${SUPA_URL}/rest/v1/feature_flags?select=*&order=key.asc`,{headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`}});
      const rows=await r.json();
      if(Array.isArray(rows))setFeatureFlags(rows);
    }catch(e){console.warn("[Flags] erro:",e);}
  },[]);
  useEffect(()=>{if(user){fetchFlags();fetchFreteConfig();}},[user]);
  const toggleFlag=async(key,currentValue)=>{
    const newValue=!currentValue;
    const warnings=["supabase"];
    if(warnings.includes(key)&&!newValue){
      if(!confirm(`⚠️ ATENÇÃO: Desativar "${key}" pode causar perda de dados. Os pedidos deixarão de ser gravados. Tem certeza?`))return;
    }
    try{
      const res=await fetch(`${SUPA_URL}/rest/v1/feature_flags?key=eq.${encodeURIComponent(key)}`,{method:"PATCH",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify({enabled:newValue,updated_at:new Date().toISOString(),updated_by:user?.email||"admin"})});
      const txt=await res.text();
      console.log(`[Flags] toggle ${key} → ${newValue}. Status:`,res.status,"Resposta:",txt);
      if(!res.ok){
        show(`❌ ${res.status}: ${txt.slice(0,100)}`);
        return;
      }
      // Parse pra confirmar que mudou mesmo
      try{
        const rows=JSON.parse(txt);
        if(Array.isArray(rows)&&rows.length>0){
          const confirmado=rows[0].enabled===newValue;
          if(!confirmado){
            show(`⚠️ API retornou ${rows[0].enabled} mas pediu ${newValue}`);
            return;
          }
        }else{
          show(`⚠️ Nenhuma linha afetada — flag "${key}" existe?`);
          return;
        }
      }catch(parseErr){console.warn("Parse:",parseErr);}
      show(`${key} ${newValue?"✅ ativado":"⏸️ pausado"}`);
      fetchFlags();
    }catch(e){console.error("[Flags] toggle error:",e);show("❌ "+e.message);}
  };
  const[editCupom,setEditCupom]=useState(null);
  const[novoCupom,setNovoCupom]=useState(null);

  const fetchCupons=useCallback(async()=>{
    setCuponsLoading(true);
    try{
      const c=await supaGet("cupons","order=created_at.desc");
      const u=await supaGet("cupons_uso","order=created_at.desc&limit=100");
      if(Array.isArray(c))setCupons(c);
      if(Array.isArray(u))setCuponsUso(u);
    }catch(e){console.warn("[Cupons]",e)}
    setCuponsLoading(false);
  },[]);

  useEffect(()=>{if(user)fetchCupons()},[user]);

  const toggleCupom=async(id,ativo)=>{
    await supaPatch("cupons",`id=eq.${id}`,{ativo:!ativo});
    fetchCupons();
    show(`Cupom ${!ativo?"ativado":"desativado"}`);
  };
  const deleteCupom=async(id,code)=>{
    if(!confirm(`Excluir cupom ${code}?`))return;
    await supaDel("cupons",`id=eq.${id}`);
    await supaDel("cupons_uso",`cupom_code=eq.${code}`);
    fetchCupons();
    show(`${code} excluído`);
  };
  // Helpers pra normalizar listas
  const normList=(txt,fn)=>{if(!txt)return null;const arr=txt.split(/[,\n]/).map(s=>fn(s.trim())).filter(Boolean);return arr.length?arr.join(","):null;};
  const normEmail=e=>e.toLowerCase().trim();
  const normTel=t=>t.replace(/\D/g,"");
  const saveCupom=async()=>{
    if(!novoCupom.code.trim()||!novoCupom.valor)return show("Preencha código e valor");
    const data={
      code:novoCupom.code.toUpperCase().trim(),
      tipo:novoCupom.tipo,
      valor:+novoCupom.valor,
      ativo:true,
      validade:novoCupom.validade||null,
      uso_maximo:novoCupom.uso_maximo?+novoCupom.uso_maximo:null,
      escopo:novoCupom.escopo||"pedido",
      limite_40:novoCupom.limite_40?+novoCupom.limite_40:null,
      limite_240:novoCupom.limite_240?+novoCupom.limite_240:null,
      limite_500:novoCupom.limite_500?+novoCupom.limite_500:null,
      limite_mel:novoCupom.limite_mel?+novoCupom.limite_mel:null,
      restricao_emails:normList(novoCupom.restricao_emails,normEmail),
      restricao_telefones:normList(novoCupom.restricao_telefones,normTel),
      uso_unico_por_cliente:!!novoCupom.uso_unico_por_cliente
    };
    await supaPost("cupons",data);
    fetchCupons();
    setModal(null);
    show(`Cupom ${data.code} criado`);
  };
  const saveEditCupom=async()=>{
    if(!editCupom.code.trim()||!editCupom.valor)return show("Preencha código e valor");
    const data={
      code:editCupom.code.toUpperCase().trim(),
      tipo:editCupom.tipo,
      valor:+editCupom.valor,
      validade:editCupom.validade||null,
      uso_maximo:editCupom.uso_maximo?+editCupom.uso_maximo:null,
      escopo:editCupom.escopo||"pedido",
      limite_40:editCupom.limite_40?+editCupom.limite_40:null,
      limite_240:editCupom.limite_240?+editCupom.limite_240:null,
      limite_500:editCupom.limite_500?+editCupom.limite_500:null,
      limite_mel:editCupom.limite_mel?+editCupom.limite_mel:null,
      restricao_emails:normList(editCupom.restricao_emails,normEmail),
      restricao_telefones:normList(editCupom.restricao_telefones,normTel),
      uso_unico_por_cliente:!!editCupom.uso_unico_por_cliente
    };
    await supaPatch("cupons",`id=eq.${editCupom.id}`,data);
    fetchCupons();
    setModal(null);
    show(`${data.code} atualizado`);
  };
  const openNovoCupom=()=>{setNovoCupom({code:"",tipo:"percentual",valor:"",validade:"",uso_maximo:"",escopo:"240g,500g,mel,frete",limite_40:"",limite_240:"",limite_500:"",limite_mel:"",restricao_emails:"",restricao_telefones:"",uso_unico_por_cliente:false});setModal("novoCupom")};

  // ─── DEMONSTRATIVOS FINANCEIROS (auto-calculado) ───
  const CUSTOS_FIXOS_MES=useMemo(()=>custos.filter(c=>c.recorrente).reduce((s,c)=>s+c.valor,0),[custos]);
  const meses=["Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const mesNum=m=>({"Mar":3,"Abr":4,"Mai":5,"Jun":6,"Jul":7,"Ago":8,"Set":9,"Out":10,"Nov":11,"Dez":12}[m]||0);
  const dfs=useMemo(()=>{
    try{
      const data=meses.map(m=>{
        const mn=mesNum(m);
        // Receitas do mês — proteção total contra dados malformados
        const vendasMes=vendas.filter(v=>{
          try{if(!v||!v.data)return false;const d=parseDate(v.data);return d&&typeof d.getMonth==="function"&&d.getMonth()+1===mn&&d.getFullYear()===2026&&v.tipo==="Venda"}catch(e){return false}
        });
        const amostrasMes=vendas.filter(v=>{
          try{if(!v||!v.data)return false;const d=parseDate(v.data);return d&&typeof d.getMonth==="function"&&d.getMonth()+1===mn&&d.getFullYear()===2026&&v.tipo==="Amostra"}catch(e){return false}
        });
        const receita=vendasMes.reduce((s,v)=>s+(+v.rec||0),0);
        const recAmostras=amostrasMes.reduce((s,v)=>s+(+v.rec||0),0);
        const totalEntradas=receita+recAmostras;
        // Custos variáveis do mês por categoria (não-recorrentes)
        const custosMes=custos.filter(c=>c&&c.mes===m&&!c.recorrente);
        const catMP=custosMes.filter(c=>c.cat==="Matéria-prima").reduce((s,c)=>s+(+c.valor||0),0);
        const catEmb=custosMes.filter(c=>c.cat==="Embalagem").reduce((s,c)=>s+(+c.valor||0),0);
        const catRev=custosMes.filter(c=>c.cat==="Revenda").reduce((s,c)=>s+(+c.valor||0),0);
        const catFrete=custosMes.filter(c=>c.cat==="Frete").reduce((s,c)=>s+(+c.valor||0),0);
        const catFeira=custosMes.filter(c=>c.cat==="Feira/Eventos").reduce((s,c)=>s+(+c.valor||0),0);
        const catMkt=custosMes.filter(c=>c.cat==="Marketing").reduce((s,c)=>s+(+c.valor||0),0);
        const catOutros=custosMes.filter(c=>c.cat==="Outros").reduce((s,c)=>s+(+c.valor||0),0);
        const totalVar=catMP+catEmb+catRev+catFrete+catFeira+catMkt+catOutros;
        const temAtividade=totalEntradas>0||totalVar>0;
        const custosFixosMesReal=temAtividade?CUSTOS_FIXOS_MES:0;
        const totalSaidas=totalVar+custosFixosMesReal;
        const fluxoOp=totalEntradas-totalSaidas;
        const quitadosNoMes=custoPagamentos.filter(p=>{
          try{if(!p||!p.quitadoEm||!p.reembQuitado)return false;const d=parseDate(p.quitadoEm);return d&&typeof d.getMonth==="function"&&d.getTime()!==0&&d.getMonth()+1===mn&&d.getFullYear()===2026}catch(e){return false}
        });
        const reembQuitadoMes=quitadosNoMes.reduce((s,p)=>s+(+p.reembQuitado||0),0);
        const fluxoLiq=fluxoOp;
        const nPedidos=vendasMes.length;
        const ticket=nPedidos>0?receita/nPedidos:0;
        const pacs=vendasMes.reduce((s,v)=>s+(+v.q40||0)+(+v.q240||0)+(+v.q500||0)+(+v.qMel||0),0);
        const margem=totalEntradas>0?(totalEntradas-totalSaidas)/totalEntradas:0;
        return{m,receita,recAmostras,totalEntradas,catMP,catEmb,catRev,catFrete,catFeira,catMkt,catOutros,totalVar,custosFixosMesReal,totalSaidas,fluxoOp,reembQuitadoMes,fluxoLiq,nPedidos,ticket,pacs,margem};
      });
      let saldo=0;
      data.forEach(d=>{d.saldoInicial=saldo;saldo+=d.fluxoLiq;d.saldoFinal=saldo});
      const tot={m:"TOTAL",receita:data.reduce((s,d)=>s+d.receita,0),recAmostras:data.reduce((s,d)=>s+d.recAmostras,0),totalEntradas:data.reduce((s,d)=>s+d.totalEntradas,0),catMP:data.reduce((s,d)=>s+d.catMP,0),catEmb:data.reduce((s,d)=>s+d.catEmb,0),catRev:data.reduce((s,d)=>s+(d.catRev||0),0),catFrete:data.reduce((s,d)=>s+d.catFrete,0),catFeira:data.reduce((s,d)=>s+d.catFeira,0),catMkt:data.reduce((s,d)=>s+d.catMkt,0),catOutros:data.reduce((s,d)=>s+d.catOutros,0),totalVar:data.reduce((s,d)=>s+d.totalVar,0),custosFixosMesReal:data.reduce((s,d)=>s+d.custosFixosMesReal,0),totalSaidas:data.reduce((s,d)=>s+d.totalSaidas,0),fluxoOp:data.reduce((s,d)=>s+d.fluxoOp,0),reembQuitadoMes:data.reduce((s,d)=>s+d.reembQuitadoMes,0),fluxoLiq:data.reduce((s,d)=>s+d.fluxoLiq,0),nPedidos:data.reduce((s,d)=>s+d.nPedidos,0),ticket:0,pacs:data.reduce((s,d)=>s+d.pacs,0),margem:0,saldoFinal:saldo};
      tot.ticket=tot.nPedidos>0?tot.receita/tot.nPedidos:0;
      tot.margem=tot.totalEntradas>0?(tot.totalEntradas-tot.totalSaidas)/tot.totalEntradas:0;
      tot.reembPendenteTotal=custoPagamentos.filter(p=>p&&p.pagador!=="Kroc").reduce((s,p)=>s+(+p.reembPendente||0),0);
      return{data,tot};
    }catch(e){
      console.error("[dfs] erro no cálculo:",e);
      const empty={m:"",receita:0,recAmostras:0,totalEntradas:0,catMP:0,catEmb:0,catRev:0,catFrete:0,catFeira:0,catMkt:0,catOutros:0,totalVar:0,custosFixosMesReal:0,totalSaidas:0,fluxoOp:0,reembQuitadoMes:0,fluxoLiq:0,nPedidos:0,ticket:0,pacs:0,margem:0,saldoInicial:0,saldoFinal:0};
      return{data:meses.map(m=>({...empty,m})),tot:{...empty,m:"TOTAL",reembPendenteTotal:0}};
    }
  },[vendas,custos,custoPagamentos]);

  // ─── DRE (Demonstração do Resultado do Exercício) ───
  // Estrutura padrão: Receita Bruta → Deduções → ROL → CMV → Lucro Bruto → Despesas Operacionais → EBITDA → Lucro Líquido
  const dre=useMemo(()=>{
    const t=dfs.tot;
    // Receita
    const receitaBruta=t.totalEntradas;  // vendas + amostras (amostras = custo de marketing implícito)
    const deducoes=0;  // sem impostos retidos no MEI/Simples ainda
    const rol=receitaBruta-deducoes;  // Receita Operacional Líquida
    // CMV (Custo da Mercadoria Vendida)
    const cmvMP=t.catMP;          // Granola: matéria-prima
    const cmvEmb=t.catEmb;        // Granola: embalagens
    const cmvRev=t.catRev||0;     // Mel: produto pronto pra revenda
    const cmv=cmvMP+cmvEmb+cmvRev;
    // Lucro Bruto
    const lucroBruto=rol-cmv;
    const margemBruta=rol>0?lucroBruto/rol:0;
    // Despesas Operacionais
    const despFrete=t.catFrete;
    const despFeira=t.catFeira;
    const despMkt=t.catMkt;
    const despFixos=t.custosFixosMesReal;
    const despOutros=t.catOutros;
    const totalDespesas=despFrete+despFeira+despMkt+despFixos+despOutros;
    // EBITDA
    const ebitda=lucroBruto-totalDespesas;
    const margemEbitda=rol>0?ebitda/rol:0;
    const lucroLiquido=ebitda;
    const margemLiquida=rol>0?lucroLiquido/rol:0;
    return{
      receitaBruta,deducoes,rol,
      cmvMP,cmvEmb,cmvRev,cmv,lucroBruto,margemBruta,
      despFrete,despFeira,despMkt,despFixos,despOutros,totalDespesas,
      ebitda,margemEbitda,lucroLiquido,margemLiquida
    };
  },[dfs]);

  // ─── BALANÇO PATRIMONIAL (snapshot atual) ───
  // ATIVO: Caixa + Estoque (matéria-prima + produtos acabados a custo)
  // PASSIVO: Reembolsos pendentes (dívidas com sócios) + Capital Social (PL)
  const balanco=useMemo(()=>{
    // ATIVO CIRCULANTE
    // Caixa = saldo acumulado dos DFs
    const caixa=dfs.tot.saldoFinal;
    // Estoque de matéria-prima (kg comprados ainda não consumidos × preço médio)
    const estoqueMP=ing.reduce((s,i)=>{
      // i.comprado é o total. Pra calcular quanto sobra precisa subtrair o consumido nos lotes
      const consumido=lotes.reduce((sk,l)=>sk+((+l.kg||0)+(+l.sobra||0))*(i.prop||0),0);
      const restante=Math.max(0,(i.comprado||0)-consumido);
      return s+restante*(i.precoKg||0);
    },0);
    // Estoque de produtos acabados (unidades em estoque × custo unitário)
    // Custo unitário usa o cálculo de prodCusto (custoTotal = ing + emb)
    const stockBySku={"40":0,"240":0,"500":0};
    lotes.forEach(l=>{
      stockBySku["40"]+=(+l.p40||0);
      stockBySku["240"]+=(+l.p240||0);
      stockBySku["500"]+=(+l.p500||0);
    });
    // Subtrai já vendido (qtd em pedidos como "Entregue")
    vendas.filter(v=>v.entreg).forEach(v=>{
      stockBySku["40"]-=(v.q40||0);
      stockBySku["240"]-=(v.q240||0);
      stockBySku["500"]-=(v.q500||0);
    });
    Object.keys(stockBySku).forEach(k=>{stockBySku[k]=Math.max(0,stockBySku[k])});
    const custos40=prodCusto.find(p=>p.id==="40g")?.custoTotal||0;
    const custos240=prodCusto.find(p=>p.id==="240g")?.custoTotal||0;
    const custos500=prodCusto.find(p=>p.id==="500g")?.custoTotal||0;
    const estoquePA=stockBySku["40"]*custos40+stockBySku["240"]*custos240+stockBySku["500"]*custos500;
    // Contas a Receber (vendas com pagamento Pendente)
    const contasReceber=vendas.filter(v=>v.tipo==="Venda"&&!v.pago).reduce((s,v)=>s+v.rec,0);
    const ativoCirculante=caixa+estoqueMP+estoquePA+contasReceber;
    
    // ATIVO NÃO-CIRCULANTE — sem ativos imobilizados rastreados ainda
    const ativoNaoCirculante=0;
    
    const ativoTotal=ativoCirculante+ativoNaoCirculante;
    
    // PASSIVO CIRCULANTE
    // Reembolsos pendentes a sócios (dívida de curto prazo)
    const reembPendente=custoPagamentos.filter(p=>p.pagador!=="Kroc").reduce((s,p)=>s+(p.reembPendente||0),0);
    // Custos pendentes de pagamento (status="Pendente")
    const custosPendentes=custos.filter(c=>c.status==="Pendente").reduce((s,c)=>s+c.valor,0);
    const passivoCirculante=reembPendente+custosPendentes;
    
    // PATRIMÔNIO LÍQUIDO
    // PL = Ativo - Passivo. Pode-se decompor em Capital Social (aporte inicial) + Lucros Acumulados
    // Sem aporte inicial registrado, PL inteiro é "Lucros Acumulados"
    const patrimonioLiquido=ativoTotal-passivoCirculante;
    
    return{
      caixa,estoqueMP,estoquePA,contasReceber,ativoCirculante,
      ativoNaoCirculante,ativoTotal,
      reembPendente,custosPendentes,passivoCirculante,
      patrimonioLiquido,
      stockBySku,custos40,custos240,custos500
    };
  },[dfs,ing,lotes,vendas,prodCusto,custoPagamentos,custos]);

  // ─── DOWNLOAD CSV ───
  const downloadCSV=(filename,rows)=>{
    // rows = array de arrays. Cada sub-array = 1 linha
    const csvContent=rows.map(row=>row.map(cell=>{
      const s=String(cell??"");
      // Escape: se tem vírgula, aspas ou newline, envolve em aspas e escapa aspas internas
      if(/[",\n;]/.test(s))return`"${s.replace(/"/g,'""')}"`;
      return s;
    }).join(";")).join("\n");
    // BOM pra Excel BR detectar UTF-8
    const blob=new Blob(["\ufeff"+csvContent],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");
    link.href=url;
    link.download=filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  const exportFluxoCSV=()=>{
    const num=v=>(v||0).toFixed(2).replace(".",",");
    const rows=[];
    rows.push(["Conta",...dfs.data.map(d=>d.m),"TOTAL"]);
    rows.push(["=== ENTRADAS ==="]);
    rows.push(["Receita de Vendas",...dfs.data.map(d=>num(d.receita)),num(dfs.tot.receita)]);
    rows.push(["Receita Amostras",...dfs.data.map(d=>num(d.recAmostras)),num(dfs.tot.recAmostras)]);
    rows.push(["Total Entradas",...dfs.data.map(d=>num(d.totalEntradas)),num(dfs.tot.totalEntradas)]);
    rows.push([""]);
    rows.push(["=== SAÍDAS ==="]);
    rows.push(["Matéria-Prima",...dfs.data.map(d=>num(d.catMP)),num(dfs.tot.catMP)]);
    rows.push(["Embalagens",...dfs.data.map(d=>num(d.catEmb)),num(dfs.tot.catEmb)]);
    rows.push(["Revenda (Mel)",...dfs.data.map(d=>num(d.catRev||0)),num(dfs.tot.catRev||0)]);
    rows.push(["Frete",...dfs.data.map(d=>num(d.catFrete)),num(dfs.tot.catFrete)]);
    rows.push(["Feira/Eventos",...dfs.data.map(d=>num(d.catFeira)),num(dfs.tot.catFeira)]);
    rows.push(["Marketing",...dfs.data.map(d=>num(d.catMkt)),num(dfs.tot.catMkt)]);
    rows.push(["Outros",...dfs.data.map(d=>num(d.catOutros)),num(dfs.tot.catOutros)]);
    rows.push(["Custos Fixos",...dfs.data.map(d=>num(d.custosFixosMesReal)),num(dfs.tot.custosFixosMesReal)]);
    rows.push(["Total Saídas",...dfs.data.map(d=>num(d.totalSaidas)),num(dfs.tot.totalSaidas)]);
    rows.push([""]);
    rows.push(["FLUXO LÍQUIDO",...dfs.data.map(d=>num(d.fluxoLiq)),num(dfs.tot.fluxoLiq)]);
    rows.push(["Saldo Inicial",...dfs.data.map(d=>num(d.saldoInicial)),""]);
    rows.push(["SALDO ACUMULADO",...dfs.data.map(d=>num(d.saldoFinal)),num(dfs.tot.saldoFinal)]);
    rows.push([""]);
    rows.push(["=== INDICADORES ==="]);
    rows.push(["Nº Pedidos",...dfs.data.map(d=>d.nPedidos),dfs.tot.nPedidos]);
    rows.push(["Pacotes",...dfs.data.map(d=>d.pacs),dfs.tot.pacs]);
    rows.push(["Ticket Médio",...dfs.data.map(d=>num(d.ticket)),num(dfs.tot.ticket)]);
    rows.push(["Margem (%)",...dfs.data.map(d=>(d.margem*100).toFixed(1)),(dfs.tot.margem*100).toFixed(1)]);
    downloadCSV(`Kroc_Fluxo_Caixa_${today()}.csv`,rows);
  };
  
  const exportDreCSV=()=>{
    const num=v=>(v||0).toFixed(2).replace(".",",");
    const pct=v=>(v*100).toFixed(2).replace(".",",")+"%";
    const rows=[
      ["DRE — Demonstração do Resultado","2026 (acumulado)","R$","%"],
      [""],
      ["RECEITA BRUTA",num(dre.receitaBruta),"100%"],
      ["(-) Deduções",num(-dre.deducoes),""],
      ["(=) RECEITA OPERACIONAL LÍQUIDA",num(dre.rol),"100%"],
      [""],
      ["(-) Custo da Mercadoria Vendida (CMV)",num(-dre.cmv),""],
      ["    Matéria-Prima",num(-dre.cmvMP),""],
      ["    Embalagens",num(-dre.cmvEmb),""],
      ["    Revenda (Mel)",num(-(dre.cmvRev||0)),""],
      ["(=) LUCRO BRUTO",num(dre.lucroBruto),pct(dre.margemBruta)],
      [""],
      ["(-) Despesas Operacionais",num(-dre.totalDespesas),""],
      ["    Frete",num(-dre.despFrete),""],
      ["    Feira/Eventos",num(-dre.despFeira),""],
      ["    Marketing",num(-dre.despMkt),""],
      ["    Custos Fixos",num(-dre.despFixos),""],
      ["    Outros",num(-dre.despOutros),""],
      ["(=) EBITDA / Lucro Operacional",num(dre.ebitda),pct(dre.margemEbitda)],
      [""],
      ["(=) LUCRO LÍQUIDO",num(dre.lucroLiquido),pct(dre.margemLiquida)]
    ];
    downloadCSV(`Kroc_DRE_${today()}.csv`,rows);
  };
  
  const exportBalancoCSV=()=>{
    const num=v=>(v||0).toFixed(2).replace(".",",");
    const rows=[
      ["BALANÇO PATRIMONIAL",`Snapshot de ${fds(today())}`,""],
      [""],
      ["ATIVO",""],
      ["  Ativo Circulante","",num(balanco.ativoCirculante)],
      ["    Caixa e Equivalentes","",num(balanco.caixa)],
      ["    Estoque - Matéria-Prima","",num(balanco.estoqueMP)],
      ["    Estoque - Produtos Acabados","",num(balanco.estoquePA)],
      ["    Contas a Receber","",num(balanco.contasReceber)],
      ["  Ativo Não-Circulante","",num(balanco.ativoNaoCirculante)],
      ["TOTAL ATIVO","",num(balanco.ativoTotal)],
      [""],
      ["PASSIVO + PATRIMÔNIO LÍQUIDO",""],
      ["  Passivo Circulante","",num(balanco.passivoCirculante)],
      ["    Reembolsos a Pagar (Sócios)","",num(balanco.reembPendente)],
      ["    Custos a Pagar","",num(balanco.custosPendentes)],
      ["  Patrimônio Líquido","",num(balanco.patrimonioLiquido)],
      ["    Lucros Acumulados","",num(balanco.patrimonioLiquido)],
      ["TOTAL PASSIVO + PL","",num(balanco.passivoCirculante+balanco.patrimonioLiquido)]
    ];
    downloadCSV(`Kroc_Balanco_${today()}.csv`,rows);
  };

  // ─── EDIT VENDA ───
  const openEditVenda=(v)=>{setEditItem({...v});setModal("editVenda")};
  const saveEditVenda=async()=>{
    console.log("[saveEditVenda] editItem:",editItem);
    console.log("[saveEditVenda] _supaId:",editItem._supaId);
    setVendas(p=>p.map(v=>v.id===editItem.id?{...editItem}:v));
    if(!editItem._supaId){
      console.warn("[saveEditVenda] SEM _supaId — mudança não será salva no banco!");
      show("⚠️ Sem _supaId — não salvou no banco");
      setModal(null);
      return;
    }
    try{
      const patch={
        pedido_num:editItem.id,
        cliente:editItem.comp,
        data:editItem.data,
        qtd_40:editItem.q40,
        qtd_240:editItem.q240,
        qtd_500:editItem.q500,
        qtd_mel:editItem.qMel||0,
        frete:editItem.frete,
        total:editItem.rec,
        subtotal:editItem.subtotal||0,
        custo:editItem.custo,
        lucro:editItem.lucro,
        tipo:editItem.tipo,
        canal:editItem.canal,
        metodo:editItem.met,
        producao:(editItem.prod||editItem.entreg)?"Entregue":"Pendente",
        entrega:editItem.entreg?"Entregue":"Pendente",
        pagamento:editItem.pago?"Pago":"Pendente",
        lote:editItem.lote||null,
        email:editItem._email||"",
        telefone:editItem._tel||"",
        rua:editItem._rua||"",
        numero:editItem._num||"",
        complemento:editItem._comp||"",
        bairro:editItem._bairro||"",
        cidade:editItem._cidade||"",
        estado:editItem._estado||"",
        cep:editItem._cep||"",
        cupom_code:editItem.cupomCode||"",
        desconto_valor:+editItem.descontoValor||0,
        observacoes:editItem.obs||"",
        updated_at:new Date().toISOString()
      };
      console.log("[saveEditVenda] PATCH payload:",patch);
      const res=await fetch(`${SUPA_URL}/rest/v1/pedidos?id=eq.${editItem._supaId}`,{
        method:"PATCH",
        headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=representation"},
        body:JSON.stringify(patch)
      });
      const responseText=await res.text();
      console.log("[saveEditVenda] Status:",res.status,"Response:",responseText);
      if(!res.ok){
        show(`❌ Erro ${res.status}`);
        return;
      }
      // Sincroniza campos equivalentes em orders (se existir um order linkado)
      try{
        const orderPatch={
          customer_name:editItem.comp,
          qty_40:+editItem.q40,
          qty_240:+editItem.q240,
          qty_500:+editItem.q500,
          frete:+editItem.frete,
          total_amount:+editItem.rec,
        };
        await fetch(`${SUPA_URL}/rest/v1/orders?pedido_id=eq.${encodeURIComponent(editItem.id)}`,{
          method:"PATCH",
          headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},
          body:JSON.stringify(orderPatch)
        });
      }catch(e){console.warn("[saveEditVenda] orders sync skipped:",e.message);}
      // Se quantidades mudaram, realoca FIFO
      const orig=vendas.find(v=>v.id===editItem.id);
      const qtdChanged=orig&&(orig.q40!==editItem.q40||orig.q240!==editItem.q240||orig.q500!==editItem.q500||(orig.qMel||0)!==(editItem.qMel||0));
      if(qtdChanged){
        const{alocs}=computeFIFO(+editItem.q40,+editItem.q240,+editItem.q500,+editItem.qMel||0);
        await gravarAlocacoes(editItem.id,alocs);
        const loteFinal=loteDeAlocacoes(alocs);
        if(loteFinal&&loteFinal!==editItem.lote){
          // Atualiza o lote no pedido também
          await fetch(`${SUPA_URL}/rest/v1/pedidos?id=eq.${editItem._supaId}`,{method:"PATCH",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({lote:loteFinal})});
        }
      }
    }catch(e){
      console.error("[saveEditVenda] Exception:",e);
      show(`❌ ${e.message}`);
      return;
    }
    setModal(null);
    show("✅ Venda atualizada. Realocando...");
    await reconciliar(); // recalcula alocações client-side
  };
  const deleteVenda=async(id)=>{
    if(!confirm(`Excluir ${id}?\n\nIsto remove também:\n• Alocações FIFO (devolve lote ao estoque)\n• Registro em orders (histórico de pagamento)\n• Webhook events relacionados`))return;
    const v=vendas.find(x=>x.id===id);
    if(v&&v._supaId){
      try{
        // 1) Acha o order relacionado (pela FK pedido_id) pra pegar os webhook_events primeiro
        var orderRes=await fetch(`${SUPA_URL}/rest/v1/orders?pedido_id=eq.${encodeURIComponent(id)}&select=id`,{headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`}});
        var orderRows=await orderRes.json();
        var orderIds=(orderRows||[]).map(o=>o.id);
        // 2) Remove webhook_events desses orders (se houver)
        for(const oid of orderIds){
          await fetch(`${SUPA_URL}/rest/v1/webhook_events?order_id=eq.${oid}`,{method:"DELETE",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Prefer":"return=minimal"}});
        }
        // 3) Remove os orders
        await fetch(`${SUPA_URL}/rest/v1/orders?pedido_id=eq.${encodeURIComponent(id)}`,{method:"DELETE",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Prefer":"return=minimal"}});
        // 4) Remove alocações FIFO (devolve estoque pros lotes automaticamente)
        await fetch(`${SUPA_URL}/rest/v1/pedido_lotes?pedido_num=eq.${encodeURIComponent(id)}`,{method:"DELETE",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Prefer":"return=minimal"}});
        // 5) Remove o pedido em si
        await fetch(`${SUPA_URL}/rest/v1/pedidos?id=eq.${v._supaId}`,{method:"DELETE",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Prefer":"return=minimal"}});
      }catch(e){console.warn("Supa delete",e);}
    }
    setVendas(p=>p.filter(x=>x.id!==id));
    show(`${id} excluída. Realocando...`);
    await reconciliar(); // recalcula alocações pros demais pedidos
  };

  // ─── DETALHES DA VENDA (modal de visualização) ───
  const[detalhesVenda,setDetalhesVenda]=useState(null);
  const openDetalhesVenda=(v)=>setDetalhesVenda(v)||setModal("detalhesVenda");
  // Retorna alocações FIFO de um pedido, com dados do lote
  const alocacoesDoPedido=(pedidoId)=>{
    return pedidoLotes.filter(pl=>pl.pedido_num===pedidoId).map(pl=>{
      const lote=lotes.find(l=>l.id===pl.lote_id);
      return{...pl,lote_data:lote?.data,lote_kg:lote?.kg};
    });
  };
  // Chave do cliente p/ navegação (mesma lógica do useMemo clientes)
  const chaveCliente=(v)=>{
    const addr=ga(v.comp);
    const email=(v._email||addr.email||"").toLowerCase().trim();
    const telN=telDigits(v._tel||addr.tel);
    return email||telN||v.comp.toLowerCase().trim();
  };
  const[clienteFocus,setClienteFocus]=useState(null); // nome do cliente pra destacar ao navegar
  
  // ─── CRUD CLIENTES ───
  const[clienteDetalhes,setClienteDetalhes]=useState(null);
  const[clienteEdit,setClienteEdit]=useState(null);
  const openDetalhesCliente=(c)=>{setClienteDetalhes(c);setModal("detalhesCliente");};
  const openEditCliente=(c)=>{
    // Se não tem _supaId, é um cliente só-vendas (órfão). Gera código novo.
    let codigo=c.codigo;
    if(!c._supaId||!codigo||codigo==="—"){
      const usados=clientes.map(x=>x.codigo).filter(x=>/^C\d+$/.test(x));
      let next=1;
      usados.forEach(x=>{const n=parseInt(x.slice(1),10);if(n>=next)next=n+1;});
      codigo=`C${String(next).padStart(3,"0")}`;
    }
    setClienteEdit({
      _supaId:c._supaId||null,
      codigo,
      nome:c.nome||"",
      email:c.email||"",
      tel:c.tel||"",
      end:c.end||"",
      numero:c.numero||"",
      comp_end:c.comp_end||"",
      bairro:c.bairro||"",
      cidade:c.cidade||"São Paulo",
      estado:c.estado||"SP",
      cep:c.cep||"",
      obs:c.obs||""
    });
    setModal("editCliente");
  };
  const openNovoCliente=()=>{
    // Gera próximo código
    const usados=clientes.map(c=>c.codigo).filter(c=>/^C\d+$/.test(c));
    let next=1;
    usados.forEach(c=>{const n=parseInt(c.slice(1),10);if(n>=next)next=n+1;});
    setClienteEdit({
      _supaId:null,
      codigo:`C${String(next).padStart(3,"0")}`,
      nome:"",email:"",tel:"",end:"",numero:"",comp_end:"",bairro:"",cidade:"São Paulo",estado:"SP",cep:"",obs:""
    });
    setModal("editCliente");
  };
  const saveCliente=async()=>{
    const c=clienteEdit;
    if(!c.nome||!c.nome.trim())return show("Nome obrigatório");
    const payload={
      codigo:c.codigo,
      nome:c.nome.trim(),
      email:c.email?c.email.trim().toLowerCase():null,
      telefone:c.tel?telDigits(c.tel):null,
      rua:c.end||null,numero:c.numero||null,complemento:c.comp_end||null,
      bairro:c.bairro||null,cidade:c.cidade||"São Paulo",estado:c.estado||"SP",cep:c.cep||null,
      observacoes:c.obs||null
    };
    try{
      if(c._supaId){
        await fetch(`${SUPA_URL}/rest/v1/clientes?id=eq.${c._supaId}`,{method:"PATCH",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(payload)});
        show(`✅ ${c.codigo} atualizado`);
      }else{
        await fetch(`${SUPA_URL}/rest/v1/clientes`,{method:"POST",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(payload)});
        show(`✅ ${c.codigo} criado`);
      }
      setModal(null);
      fetchClientes();
    }catch(e){show("❌ Erro ao salvar: "+e.message);}
  };
  const deleteCliente=async(c)=>{
    if(!c._supaId)return show("Cliente não cadastrado");
    if(c.compras>0){
      if(!confirm(`⚠️ ${c.nome} tem ${c.compras} compra(s). Ao excluir, os pedidos ficam sem vínculo. Continuar?`))return;
    }else{
      if(!confirm(`Excluir cliente ${c.codigo} — ${c.nome}?`))return;
    }
    try{
      await fetch(`${SUPA_URL}/rest/v1/clientes?id=eq.${c._supaId}`,{method:"DELETE",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Prefer":"return=minimal"}});
      show(`🗑️ ${c.codigo} excluído`);
      setModal(null);
      fetchClientes();
    }catch(e){show("❌ Erro ao excluir: "+e.message);}
  };
  const importarOrfao=async(c)=>{
    // Cliente existe só nas vendas — importa pro DB
    const usados=clientes.map(x=>x.codigo).filter(x=>/^C\d+$/.test(x));
    let next=1;
    usados.forEach(x=>{const n=parseInt(x.slice(1),10);if(n>=next)next=n+1;});
    const payload={
      codigo:`C${String(next).padStart(3,"0")}`,
      nome:c.nome,
      email:c.email||null,
      telefone:c.tel||null,
      rua:c.end||null,complemento:c.comp_end||null,bairro:c.bairro||null,cep:c.cep||null,
      primeira_compra:c.primeiraCompra||null,ultima_compra:c.ultimaCompra||null
    };
    try{
      await fetch(`${SUPA_URL}/rest/v1/clientes`,{method:"POST",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(payload)});
      show(`✅ ${c.nome} importado como ${payload.codigo}`);
      fetchClientes();
    }catch(e){show("❌ Erro: "+e.message);}
  };
  // ─── LOGBOOK DO LOTE (rastreamento) ───
  const[logbookLote,setLogbookLote]=useState(null);
  const openLogbook=(l)=>setLogbookLote(l)||setModal("logbook");

  // ─── NOVA VENDA MANUAL ───
  const[novaVenda,setNovaVenda]=useState(null);
  const[calcFreteLoading,setCalcFreteLoading]=useState(false);
  const openNovaVenda=()=>{
    const nextNum=vendas.length>0?Math.max(...vendas.map(v=>{const m=v.id.match(/\d+/);return m?parseInt(m[0]):0}))+1:1;
    setNovaVenda({
      id:`P${String(nextNum).padStart(4,"0")}`,
      data:today(),
      tipo:"Venda",
      canal:"Presencial",
      comp:"",
      email:"",
      telefone:"",
      rua:"",numero:"",complemento:"",bairro:"",cidade:"São Paulo",estado:"SP",cep:"",
      q40:0,q240:0,q500:0,qMel:0,
      frete:0,
      rec:0,
      cupomCode:"",
      descontoValor:0,
      lote:"",
      loteAuto:true, // lote automático por padrão
      met:"Pix",
      obs:"",
      prod:false,entreg:false,pago:false
    });
    setModal("novaVenda");
  };

  // ─── Calcula frete por endereço (Nominatim + Haversine) ───
  const calcularFretePorEndereco=async()=>{
    if(!novaVenda)return;
    const {rua,numero,bairro,cidade,estado,cep}=novaVenda;
    const partes=[rua,numero,bairro,cidade,estado,cep].filter(Boolean);
    if(partes.length<2)return show("Preencha pelo menos rua + bairro ou CEP");
    setCalcFreteLoading(true);
    try{
      const q=encodeURIComponent(partes.join(", "));
      const r=await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=br`);
      const arr=await r.json();
      if(!arr||arr.length===0){show("Endereço não encontrado");setCalcFreteLoading(false);return;}
      // Haversine
      const O={lat:-23.5247,lng:-46.6916}; // Rua Ministro Godoi, Água Branca
      const d=Math.PI/180, R=6371;
      const a1=O.lat*d,a2=(+arr[0].lat)*d;
      const dl=(+arr[0].lat-O.lat)*d, dln=(+arr[0].lon-O.lng)*d;
      const x=Math.sin(dl/2)**2+Math.cos(a1)*Math.cos(a2)*Math.sin(dln/2)**2;
      const km=R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
      // mesma lógica do site
      const custo=km<=3?5:km<=5?10:15;
      setNovaVenda(v=>({...v,frete:custo}));
      show(`📍 ~${km.toFixed(1)}km — Frete ${brl(custo)}`);
    }catch(e){show("Erro ao calcular frete");}
    setCalcFreteLoading(false);
  };

  const saveNovaVenda=async()=>{
    if(!novaVenda.comp.trim())return show("Informe o cliente");
    if(!novaVenda.data)return show("Informe a data");
    const totalQtd=(+novaVenda.q40||0)+(+novaVenda.q240||0)+(+novaVenda.q500||0)+(+novaVenda.qMel||0);
    if(totalQtd===0)return show("Informe pelo menos 1 produto");
    // Custo unitário do mel: usa custo médio das compras (prodCusto)
    const custoMel=prodCusto.find(p=>p.sku==="MEL-300")?.custoTotal||25;
    const custo=(novaVenda.q240*16.64)+(novaVenda.q500*34.41)+(novaVenda.q40*2.02)+(novaVenda.qMel*custoMel);
    const subtotal=novaVenda.q240*44.90+novaVenda.q500*84.90+novaVenda.q40*9.90+novaVenda.qMel*39.99;
    const desconto=+novaVenda.descontoValor||0;
    const rec=novaVenda.rec||(subtotal+(+novaVenda.frete||0)-desconto);
    // FIFO: calcula de quais lotes sair (granola + mel separados)
    const{alocs,falta}=computeFIFO(+novaVenda.q40,+novaVenda.q240,+novaVenda.q500,+novaVenda.qMel);
    if(falta.q40+falta.q240+falta.q500+falta.qMel>0){
      const msg=`⚠️ Estoque insuficiente — faltam ${falta.q40?falta.q40+"×40g ":""}${falta.q240?falta.q240+"×240g ":""}${falta.q500?falta.q500+"×500g ":""}${falta.qMel?falta.qMel+"×Mel":""}. Continuar mesmo assim?`;
      if(!confirm(msg))return;
    }
    const loteFinal=novaVenda.loteAuto?(loteDeAlocacoes(alocs)||null):(novaVenda.lote||null);
    const venda={
      ...novaVenda,
      q40:+novaVenda.q40,q240:+novaVenda.q240,q500:+novaVenda.q500,qMel:+novaVenda.qMel||0,
      frete:+novaVenda.frete,rec:+rec,custo,
      lucro:rec-custo-(+novaVenda.frete),
      lote:loteFinal,
      cupomCode:novaVenda.cupomCode||"",
      descontoValor:desconto,
      subtotal,
      obs:novaVenda.obs||"",
      _email:novaVenda.email,_tel:novaVenda.telefone,
      _rua:novaVenda.rua,_num:novaVenda.numero,_comp:novaVenda.complemento,
      _bairro:novaVenda.bairro,_cidade:novaVenda.cidade,_estado:novaVenda.estado,_cep:novaVenda.cep,
    };
    try{
      const payload={
        pedido_num:novaVenda.id,
        data:novaVenda.data,
        hora:new Date().toTimeString().slice(0,8),
        cliente:novaVenda.comp,
        email:novaVenda.email||"",
        telefone:novaVenda.telefone||"",
        qtd_40:+novaVenda.q40,
        qtd_240:+novaVenda.q240,
        qtd_500:+novaVenda.q500,
        qtd_mel:+novaVenda.qMel||0,
        subtotal:+subtotal,
        frete:+novaVenda.frete,
        desconto_valor:desconto,
        cupom_code:novaVenda.cupomCode||null,
        total:+rec,
        rua:novaVenda.rua||"",
        numero:novaVenda.numero||"",
        complemento:novaVenda.complemento||"",
        bairro:novaVenda.bairro||"",
        cidade:novaVenda.cidade||"São Paulo",
        estado:novaVenda.estado||"SP",
        cep:novaVenda.cep||"",
        metodo:novaVenda.met,
        canal:novaVenda.canal||"Online",
        producao:novaVenda.prod?"Entregue":"Pendente",
        entrega:novaVenda.entreg?"Entregue":"Pendente",
        pagamento:novaVenda.pago?"Pago":"Pendente",
        lote:loteFinal,
        tipo:novaVenda.tipo||"Venda",
        custo,
        lucro:rec-custo-(+novaVenda.frete),
        observacoes:novaVenda.obs||null
      };
      const r=await fetch(`${SUPA_URL}/rest/v1/pedidos`,{method:"POST",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(payload)});
      const created=await r.json();
      if(Array.isArray(created)&&created[0])venda._supaId=created[0].id;
    }catch(e){console.warn("Supa insert",e);}
    // Grava alocações FIFO
    await gravarAlocacoes(novaVenda.id,alocs);
    setVendas(p=>[...p,venda]);
    const loteMsg=alocs.length>1?` • ${alocs.length} lotes`:loteFinal?` • ${loteFinal}`:"";
    setModal(null);show(`✅ ${novaVenda.id} adicionada${loteMsg}`);
    sync();
  };
  // ─── COMPRA INGREDIENTES ───
  const[compraIng,setCompraIng]=useState(null);
  const[ingCompras,setIngCompras]=useState([]);  // histórico de compras de ingredientes
  const fetchIngCompras=useCallback(async()=>{
    try{
      const r=await fetch(`${SUPA_URL}/rest/v1/ingrediente_compras?select=*&order=data.desc,created_at.desc`,{headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`}});
      const arr=await r.json();
      if(Array.isArray(arr))setIngCompras(arr);
    }catch(e){console.warn("[ing_compras] erro:",e);}
  },[]);
  useEffect(()=>{if(user)fetchIngCompras()},[user]);
  
  // mel state movido pra perto de ing (ver mais acima)
  const fetchMelCompras=useCallback(async()=>{
    try{
      const r=await fetch(`${SUPA_URL}/rest/v1/mel_compras?select=*&order=data.desc,created_at.desc`,{headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`}});
      const arr=await r.json();
      if(Array.isArray(arr))setMelCompras(arr);
    }catch(e){console.warn("[mel_compras] erro:",e);}
  },[]);
  useEffect(()=>{if(user)fetchMelCompras()},[user]);
  
  // Modal: nova compra de mel
  const[novaCompraMel,setNovaCompraMel]=useState(null);
  const openCompraMel=()=>{
    setNovaCompraMel({
      data:today(),
      qtd_potes:"",
      custo_unit:"",
      fornecedor:"Puraflor",
      lote_fornecedor:"",
      validade:"",  // se vazio, trigger calcula 12 meses
      pagador:"Kroc",
      observacoes:""
    });
    setModal("compraMel");
  };
  
  const saveCompraMel=async()=>{
    const c=novaCompraMel;
    if(!c.qtd_potes||+c.qtd_potes<=0)return show("Informe a quantidade de potes");
    if(!c.custo_unit||+c.custo_unit<=0)return show("Informe o custo unitário");
    
    const qtd=parseInt(c.qtd_potes);
    const custoUnit=parseFloat(c.custo_unit);
    const valorTotal=qtd*custoUnit;
    
    try{
      // 1. Cria registro em mel_compras (trigger cria lote MEL-XXX automaticamente)
      const payloadMel={
        data:c.data,
        qtd_potes:qtd,
        custo_unit:custoUnit,
        fornecedor:c.fornecedor||"Puraflor",
        lote_fornecedor:c.lote_fornecedor||null,
        validade:c.validade||null,
        pagador:c.pagador||"Kroc",
        observacoes:c.observacoes||null
      };
      const r=await fetch(`${SUPA_URL}/rest/v1/mel_compras`,{
        method:"POST",
        headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=representation"},
        body:JSON.stringify(payloadMel)
      });
      if(!r.ok){const t=await r.text();show(`❌ ${r.status}: ${t.slice(0,80)}`);return;}
      const created=await r.json();
      const compraCriada=Array.isArray(created)?created[0]:created;
      
      // 2. Cria registro em custos (categoria "Revenda")
      const descricao=`${qtd} potes Mel Silvestre Puraflor — ${c.fornecedor||"Puraflor"}`;
      const payloadCusto={
        mes:mesAbrev(c.data),
        data:c.data,
        despesa:"Compra Mel",
        descricao,
        fornecedor:c.fornecedor||"Puraflor",
        categoria:"Revenda",
        valor:valorTotal,
        pagador:c.pagador||"Kroc",
        reemb:c.pagador==="Kroc"?0:valorTotal,
        recorrente:false
      };
      const rc=await fetch(`${SUPA_URL}/rest/v1/custos`,{
        method:"POST",
        headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=representation"},
        body:JSON.stringify(payloadCusto)
      });
      if(rc.ok){
        const custoCriado=await rc.json();
        const custoId=Array.isArray(custoCriado)?custoCriado[0].id:custoCriado.id;
        // Vincula compra ao custo
        if(custoId&&compraCriada?.id){
          await fetch(`${SUPA_URL}/rest/v1/mel_compras?id=eq.${compraCriada.id}`,{
            method:"PATCH",
            headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},
            body:JSON.stringify({custo_id:custoId})
          });
          // Cria pagamento
          await fetch(`${SUPA_URL}/rest/v1/custo_pagamentos`,{
            method:"POST",
            headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},
            body:JSON.stringify({
              custo_id:custoId,
              pagador:c.pagador||"Kroc",
              valor_pago:valorTotal,
              valor_reemb_pendente:c.pagador==="Kroc"?0:valorTotal,
              valor_reemb_quitado:0
            })
          });
        }
      }
      
      setModal(null);
      show(`✅ ${qtd} potes de mel adicionados ao estoque`);
      await fetchMelCompras();
      sync();
    }catch(e){
      console.error("[saveCompraMel]:",e);
      show(`❌ ${e.message}`);
    }
  };
  
  const deleteCompraMel=async(compra)=>{
    if(!confirm(`Excluir compra de ${compra.qtd_potes} potes de mel em ${fds(compra.data)}?\n\nO lote ${compra.lote_id} associado e o custo nas DFs também serão removidos.`))return;
    try{
      // Remove a compra (trigger deleta lote automaticamente)
      await fetch(`${SUPA_URL}/rest/v1/mel_compras?id=eq.${compra.id}`,{method:"DELETE",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Prefer":"return=minimal"}});
      // Remove o custo associado
      if(compra.custo_id){
        await fetch(`${SUPA_URL}/rest/v1/custos?id=eq.${compra.custo_id}`,{method:"DELETE",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Prefer":"return=minimal"}});
      }
      show("🗑️ Compra de mel excluída");
      await fetchMelCompras();
      sync();
    }catch(e){show(`❌ ${e.message}`);}
  };
  
  // Modal: editar compra de mel
  const[editCompraMel,setEditCompraMel]=useState(null);
  const openEditCompraMel=(c)=>{
    setEditCompraMel({
      id:c.id,
      data:c.data,
      qtd_potes:String(c.qtd_potes||""),
      custo_unit:String(c.custo_unit||""),
      fornecedor:c.fornecedor||"Puraflor",
      lote_fornecedor:c.lote_fornecedor||"",
      validade:c.validade||"",
      pagador:c.pagador||"Kroc",
      observacoes:c.observacoes||"",
      custo_id:c.custo_id,
      lote_id:c.lote_id
    });
    setModal("editCompraMel");
  };
  
  const saveEditCompraMel=async()=>{
    const e=editCompraMel;
    if(!e.qtd_potes||!e.custo_unit)return show("Preencha quantidade e custo");
    const qtd=parseInt(e.qtd_potes);
    const custoUnit=parseFloat(e.custo_unit);
    const valorTotal=qtd*custoUnit;
    try{
      // 1. Atualiza compra
      await fetch(`${SUPA_URL}/rest/v1/mel_compras?id=eq.${e.id}`,{
        method:"PATCH",
        headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},
        body:JSON.stringify({
          data:e.data,
          qtd_potes:qtd,
          custo_unit:custoUnit,
          fornecedor:e.fornecedor||"Puraflor",
          lote_fornecedor:e.lote_fornecedor||null,
          validade:e.validade||null,
          pagador:e.pagador||"Kroc",
          observacoes:e.observacoes||null
        })
      });
      // 2. Atualiza lote (data e qtd)
      if(e.lote_id){
        await fetch(`${SUPA_URL}/rest/v1/lotes?lote_id=eq.${e.lote_id}`,{
          method:"PATCH",
          headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},
          body:JSON.stringify({data:e.data,p_mel:qtd})
        });
      }
      // 3. Atualiza custo
      if(e.custo_id){
        await fetch(`${SUPA_URL}/rest/v1/custos?id=eq.${e.custo_id}`,{
          method:"PATCH",
          headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},
          body:JSON.stringify({
            data:e.data,
            mes:mesAbrev(e.data),
            valor:valorTotal,
            fornecedor:e.fornecedor||"Puraflor",
            pagador:e.pagador||"Kroc"
          })
        });
        await fetch(`${SUPA_URL}/rest/v1/custo_pagamentos?custo_id=eq.${e.custo_id}`,{
          method:"PATCH",
          headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},
          body:JSON.stringify({
            pagador:e.pagador||"Kroc",
            valor_pago:valorTotal,
            valor_reemb_pendente:e.pagador==="Kroc"?0:valorTotal
          })
        });
      }
      setModal(null);
      show("✅ Compra de mel atualizada");
      await fetchMelCompras();
      sync();
    }catch(err){
      console.error("[saveEditCompraMel]:",err);
      show(`❌ ${err.message}`);
    }
  };
  
  const openCompra=()=>{setCompraIng({data:today(),forn:"",pag:"Kroc",itens:ing.map(i=>({nome:i.nome,kg:"",preco:i.precoKg}))});setModal("compra")};
  const saveCompra=async()=>{
    const v=compraIng.itens.filter(i=>parseFloat(i.kg)>0);
    if(!v.length)return show("Adicione pelo menos um ingrediente");
    const tot=v.reduce((s,i)=>s+parseFloat(i.kg)*parseFloat(i.preco),0);
    try{
      // 1. Cria registro de custo no Supabase
      const custoPayload={
        mes:mesAbrev(compraIng.data),
        data:compraIng.data,
        despesa:"Compra Ingredientes",
        descricao:v.map(i=>`${i.kg}kg ${i.nome}`).join(", "),
        fornecedor:compraIng.forn||null,
        categoria:"Matéria-prima",
        valor:tot,
        pagador:compraIng.pag,
        reemb:compraIng.pag==="Kroc"?0:tot,
        recorrente:false
      };
      const cr=await fetch(`${SUPA_URL}/rest/v1/custos`,{method:"POST",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(custoPayload)});
      const custoCreated=await cr.json();
      const custoId=Array.isArray(custoCreated)&&custoCreated[0]?custoCreated[0].id:null;
      
      // 2. Cria pagamento do custo
      if(custoId){
        await fetch(`${SUPA_URL}/rest/v1/custo_pagamentos`,{method:"POST",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({
          custo_id:custoId,pagador:compraIng.pag,valor_pago:tot,
          valor_reemb_pendente:compraIng.pag==="Kroc"?0:tot,
          valor_reemb_quitado:0
        })});
      }
      
      // 3. Grava cada compra em ingrediente_compras
      const comprasPayload=v.map(i=>({
        ingrediente_nome:i.nome,
        data:compraIng.data,
        kg:parseFloat(i.kg),
        preco_kg:parseFloat(i.preco),
        fornecedor:compraIng.forn||null,
        pagador:compraIng.pag,
        custo_id:custoId
      }));
      const r=await fetch(`${SUPA_URL}/rest/v1/ingrediente_compras`,{method:"POST",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(comprasPayload)});
      if(!r.ok){
        const txt=await r.text();
        throw new Error(`Erro ao salvar compras: ${txt}`);
      }
      
      // 4. Atualiza estado local e sincroniza
      setModal(null);
      show(`✅ Compra registrada: ${brl(tot)}`);
      await fetchIngCompras();
      sync();  // reload ingredientes + custos
    }catch(e){
      console.error("[saveCompra] erro:",e);
      show(`❌ Erro ao salvar: ${e.message}`);
    }
  };
  
  // ─── EDITAR INGREDIENTE INDIVIDUAL ───
  const[ingEdit,setIngEdit]=useState(null);
  const[ingDetalhes,setIngDetalhes]=useState(null);
  const openDetalhesIng=(i)=>{setIngDetalhes(i);setModal("detalhesIng");};
  const openEditIng=(i)=>{setIngEdit({nome:i.nome,comprado:String(i.comprado||0),precoKg:String(i.precoKg||0),prop:String(i.prop||0),_supaId:i._supaId});setModal("editIng");};
  const saveEditIng=async()=>{
    const e=ingEdit;
    if(!e._supaId)return show("Erro: sem ID do ingrediente");
    try{
      await fetch(`${SUPA_URL}/rest/v1/ingredientes?id=eq.${e._supaId}`,{method:"PATCH",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({
        comprado:parseFloat(e.comprado)||0,
        preco_kg:parseFloat(e.precoKg)||0,
        prop:parseFloat(e.prop)||0
      })});
      setModal(null);
      show(`✅ ${e.nome} atualizado`);
      sync();
    }catch(err){show(`❌ Erro: ${err.message}`);}
  };
  const deleteCompraIng=async(compra)=>{
    if(!confirm(`Excluir compra de ${compra.kg}kg de ${compra.ingrediente_nome} em ${fds(compra.data)}?\n\nIsto também remove o custo associado nas DFs (se houver).\n\nO estoque vai ser recalculado automaticamente.`))return;
    try{
      // 1. Remove a compra do ingrediente (trigger recalcula estoque)
      await fetch(`${SUPA_URL}/rest/v1/ingrediente_compras?id=eq.${compra.id}`,{method:"DELETE",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Prefer":"return=minimal"}});
      // 2. Se a compra tinha custo_id associado, remove o custo das DFs
      // Se outras compras compartilham o mesmo custo (compra múltipla), só remove se for a última
      if(compra.custo_id){
        const r=await fetch(`${SUPA_URL}/rest/v1/ingrediente_compras?custo_id=eq.${compra.custo_id}&select=id`,{headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`}});
        const restantes=await r.json();
        if(Array.isArray(restantes)&&restantes.length===0){
          // Sem mais compras vinculadas → remove o custo
          await fetch(`${SUPA_URL}/rest/v1/custos?id=eq.${compra.custo_id}`,{method:"DELETE",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Prefer":"return=minimal"}});
        }
      }
      show(`🗑️ Compra excluída`);
      await fetchIngCompras();
      sync();
    }catch(e){show(`❌ Erro: ${e.message}`);}
  };
  
  // ─── EDITAR COMPRA INDIVIDUAL ───
  const[editCompraIng,setEditCompraIng]=useState(null);
  const openEditCompraIng=(c)=>{
    setEditCompraIng({
      id:c.id,
      ingrediente_nome:c.ingrediente_nome,
      data:c.data,
      kg:String(c.kg||""),
      preco_kg:String(c.preco_kg||""),
      fornecedor:c.fornecedor||"",
      pagador:c.pagador||"Kroc",
      observacoes:c.observacoes||"",
      custo_id:c.custo_id
    });
    setModal("editCompraIng");
  };
  const saveEditCompraIng=async()=>{
    const e=editCompraIng;
    if(!e.id)return show("Erro: sem ID");
    if(!e.kg||!e.preco_kg)return show("Preencha kg e preço");
    const novoTotal=parseFloat(e.kg)*parseFloat(e.preco_kg);
    try{
      // 1. Atualiza compra (trigger recalcula estoque do ingrediente)
      await fetch(`${SUPA_URL}/rest/v1/ingrediente_compras?id=eq.${e.id}`,{method:"PATCH",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({
        ingrediente_nome:e.ingrediente_nome,
        data:e.data,
        kg:parseFloat(e.kg),
        preco_kg:parseFloat(e.preco_kg),
        fornecedor:e.fornecedor||null,
        pagador:e.pagador,
        observacoes:e.observacoes||null
      })});
      // 2. Se há custo associado, atualiza valor e mês também
      if(e.custo_id){
        // Pega outras compras desse custo pra recalcular o total
        const r=await fetch(`${SUPA_URL}/rest/v1/ingrediente_compras?custo_id=eq.${e.custo_id}&select=kg,preco_kg,ingrediente_nome`,{headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`}});
        const compras=await r.json();
        if(Array.isArray(compras)){
          const valorTotal=compras.reduce((s,c)=>s+(parseFloat(c.kg)||0)*(parseFloat(c.preco_kg)||0),0);
          const descricao=compras.map(c=>`${c.kg}kg ${c.ingrediente_nome}`).join(", ");
          await fetch(`${SUPA_URL}/rest/v1/custos?id=eq.${e.custo_id}`,{method:"PATCH",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({
            valor:valorTotal,
            data:e.data,
            mes:mesAbrev(e.data),
            descricao:descricao,
            fornecedor:e.fornecedor||null,
            pagador:e.pagador
          })});
          // Atualiza pagamento principal também
          await fetch(`${SUPA_URL}/rest/v1/custo_pagamentos?custo_id=eq.${e.custo_id}`,{method:"PATCH",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({
            pagador:e.pagador,
            valor_pago:valorTotal,
            valor_reemb_pendente:e.pagador==="Kroc"?0:valorTotal
          })});
        }
      }
      setModal(null);
      show(`✅ Compra atualizada`);
      await fetchIngCompras();
      sync();
    }catch(err){
      console.error("[saveEditCompraIng]:",err);
      show(`❌ ${err.message}`);
    }
  };

  // ─── NOVO LOTE ───
  const calcKgLote=(p40,p240,p500,sobra)=>((+p40||0)*0.04+(+p240||0)*0.24+(+p500||0)*0.5+(+sobra||0));
  const[novoLote,setNovoLote]=useState(null);
  const openLote=()=>{
    // Sugere próximo ID baseado no maior L0NN existente
    const maxLote=lotes.reduce((m,l)=>{const n=parseInt((l.id||"").replace(/\D/g,""))||0;return Math.max(m,n);},0);
    const nextId=`L${String(maxLote+1).padStart(3,"0")}`;
    setNovoLote({id:nextId,data:today(),p40:"0",p240:"0",p500:"0",sobra:"0"});
    setModal("lote");
  };
  const saveLote=async()=>{
    const kg=calcKgLote(novoLote.p40,novoLote.p240,novoLote.p500,novoLote.sobra);
    if(kg<=0)return show("Informe pacotes ou sobra");
    // Verifica se ID já existe
    if(lotes.some(l=>l.id===novoLote.id))return show(`Lote ${novoLote.id} já existe — escolha outro número`);
    try{
      const payload={
        lote_id:novoLote.id,
        data:novoLote.data,
        kg:kg,
        p40:+novoLote.p40||0,
        p240:+novoLote.p240||0,
        p500:+novoLote.p500||0,
        sobra:+(novoLote.sobra||0)
      };
      const r=await fetch(`${SUPA_URL}/rest/v1/lotes`,{method:"POST",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(payload)});
      if(!r.ok){const t=await r.text();show(`❌ ${r.status}: ${t.slice(0,100)}`);return;}
      setModal(null);
      show(`✅ Lote ${novoLote.id} — ${kg.toFixed(2)}kg registrado. Realocando pendências...`);
      // Recalcula tudo client-side: popula unidades + realoca pedidos + sync
      await reconciliar();
      show(`✅ Lote ${novoLote.id} registrado e pendências realocadas`);
    }catch(e){show(`❌ ${e.message}`);}
  };
  const deleteLote=async(id)=>{
    if(!confirm(`Excluir lote ${id}?\n\n⚠️ As alocações dos pedidos que usam esse lote serão recalculadas.`))return;
    const l=lotes.find(x=>x.id===id);
    if(!l||!l._supaId)return show("Lote não encontrado no banco");
    try{
      // Remove alocações FIFO vinculadas (baixas não são afetadas)
      await fetch(`${SUPA_URL}/rest/v1/pedido_lotes?lote_id=eq.${encodeURIComponent(id)}&pedido_num=not.like.BX-*`,{method:"DELETE",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Prefer":"return=minimal"}});
      // Remove o lote (unidades são removidas automaticamente via ON DELETE CASCADE)
      await fetch(`${SUPA_URL}/rest/v1/lotes?id=eq.${l._supaId}`,{method:"DELETE",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Prefer":"return=minimal"}});
      show(`Lote ${id} excluído. Realocando...`);
      await reconciliar();
    }catch(e){show(`❌ ${e.message}`);}
  };
  const[editLoteItem,setEditLoteItem]=useState(null);
  const openEditLote=(l)=>setEditLoteItem({...l,p40:String(l.p40||0),p240:String(l.p240||0),p500:String(l.p500||0),sobra:String(l.sobra||0)})||setModal("editLote");
  const saveEditLote=async()=>{
    if(!editLoteItem._supaId)return show("Erro: sem ID");
    const kg=calcKgLote(editLoteItem.p40,editLoteItem.p240,editLoteItem.p500,editLoteItem.sobra);
    try{
      await fetch(`${SUPA_URL}/rest/v1/lotes?id=eq.${editLoteItem._supaId}`,{method:"PATCH",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({data:editLoteItem.data,kg:kg,p40:+editLoteItem.p40||0,p240:+editLoteItem.p240||0,p500:+editLoteItem.p500||0,sobra:+(editLoteItem.sobra||0)})});
      setModal(null);show(`✅ Lote ${editLoteItem.id} atualizado. Realocando...`);
      await reconciliar();
    }catch(e){show(`❌ ${e.message}`);}
  };
  // editLote é um alias de editLoteItem pra compatibilidade com o modal
  const editLote=editLoteItem;
  const setEditLote=setEditLoteItem;

  // ─── COMPRA EMBALAGENS ───
  const[compraEmb,setCompraEmb]=useState(null);
  const openEmb=()=>{setCompraEmb({data:today(),forn:"",pag:"Caio",itens:emb.map(e=>({nome:e.nome,qtd:"",preco:e.precoMedio||0}))});setModal("emb")};
  const saveEmb=async()=>{
    const v=compraEmb.itens.filter(i=>+i.qtd>0);
    if(!v.length)return show("Informe ao menos 1 item com quantidade");
    const totalValor=v.reduce((s,i)=>s+(+i.qtd)*(+i.preco||0),0);
    if(totalValor<=0)return show("Informe os preços unitários");
    // Atualiza cada embalagem no Supabase: novo comprado + custo médio ponderado
    for(const it of v){
      const e=emb.find(x=>x.nome===it.nome);
      if(!e||!e._supaId)continue;
      const qtdAtual=e.comprado||0;
      const precoAtual=e.precoMedio||0;
      const qtdNova=+it.qtd;
      const precoNovo=+it.preco;
      // Custo médio ponderado: (qtd_atual * preco_atual + qtd_nova * preco_novo) / (qtd_atual + qtd_nova)
      const novoTotal=qtdAtual+qtdNova;
      const novoCustoMedio=novoTotal>0?((qtdAtual*precoAtual)+(qtdNova*precoNovo))/novoTotal:precoNovo;
      try{
        await fetch(`${SUPA_URL}/rest/v1/embalagens?id=eq.${e._supaId}`,{method:"PATCH",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({comprado:novoTotal,preco_medio:novoCustoMedio,updated_at:new Date().toISOString()})});
      }catch(e){console.warn("Emb update",e);}
    }
    // Registra custo
    const payload={mes:mesAbrev(compraEmb.data),data:compraEmb.data,despesa:"Compra Embalagens",descricao:v.map(i=>`${i.qtd}x ${i.nome} @ ${brl(+i.preco)}`).join(", "),fornecedor:compraEmb.forn,categoria:"Embalagem",valor:totalValor,pagador:compraEmb.pag,reemb:compraEmb.pag==="Kroc"?0:totalValor};
    try{
      await fetch(`${SUPA_URL}/rest/v1/custos`,{method:"POST",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(payload)});
    }catch(e){console.warn("Custo insert",e);}
    setModal(null);show(`✅ Embalagens: ${brl(totalValor)}`);
    sync();
  };

  // Editar embalagem (estoque atual + preço médio)
  const[editEmb,setEditEmb]=useState(null);
  const openEditEmb=(e)=>{setEditEmb({...e,comprado:String(e.comprado),usado:String(e.usado||0),precoMedio:String(e.precoMedio||0)});setModal("editEmb")};
  const saveEditEmb=async()=>{
    if(!editEmb._supaId)return show("Erro: sem ID");
    try{
      const res=await fetch(`${SUPA_URL}/rest/v1/embalagens?id=eq.${editEmb._supaId}`,{method:"PATCH",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({comprado:+editEmb.comprado,usado:+editEmb.usado,preco_medio:+editEmb.precoMedio,updated_at:new Date().toISOString()})});
      if(!res.ok){const t=await res.text();show(`❌ ${res.status}`);return;}
      setModal(null);show(`✅ ${editEmb.nome} atualizado`);
      sync();
    }catch(e){show(`❌ ${e.message}`);}
  };

  // ─── NOVA DESPESA (agora com multi-pagadores) ───
  const[novoCusto,setNovoCusto]=useState(null);
  const openCusto=()=>{setNovoCusto({
    data:today(),desp:"",desc:"",forn:"",cat:"Outros",valor:"",recorrente:false,
    // Pagadores: array de {pagador, valorPago, reembPendente}
    pagadores:[{pagador:"Kroc",valorPago:"",reembPendente:""}]
  });setModal("custo")};
  const saveCusto=async()=>{
    if(!novoCusto.desp||!+novoCusto.valor)return show("Preencha descrição e valor");
    const val=+novoCusto.valor;
    // Valida pagadores
    const pagsValidos=(novoCusto.pagadores||[]).filter(p=>p.pagador&&+p.valorPago>0);
    if(pagsValidos.length===0)return show("Adicione pelo menos 1 pagador com valor");
    const somaPago=pagsValidos.reduce((s,p)=>s+(+p.valorPago||0),0);
    if(Math.abs(somaPago-val)>0.01){
      if(!confirm(`⚠️ Soma dos pagamentos (${brl(somaPago)}) ≠ valor da despesa (${brl(val)}). Continuar assim?`))return;
    }
    // Legado: primeiro pagador vira pag (pra compatibilidade)
    const pagPrimeiro=pagsValidos[0].pagador;
    const payload={mes:mesAbrev(novoCusto.data),data:novoCusto.data,despesa:novoCusto.desp,descricao:novoCusto.desc,fornecedor:novoCusto.forn,categoria:novoCusto.cat,valor:val,pagador:pagPrimeiro,reemb:pagsValidos.reduce((s,p)=>s+(+p.reembPendente||0),0),recorrente:!!novoCusto.recorrente};
    try{
      const r=await fetch(`${SUPA_URL}/rest/v1/custos`,{method:"POST",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(payload)});
      if(!r.ok){const t=await r.text();show(`❌ ${r.status}: ${t.slice(0,80)}`);return;}
      const created=await r.json();
      const custoId=Array.isArray(created)?created[0]?.id:created?.id;
      // Cria custo_pagamentos
      if(custoId){
        const paymentsPayload=pagsValidos.map(p=>({
          custo_id:custoId,
          pagador:p.pagador,
          valor_pago:+p.valorPago,
          valor_reemb_pendente:+p.reembPendente||(p.pagador==="Kroc"?0:+p.valorPago),
        }));
        await fetch(`${SUPA_URL}/rest/v1/custo_pagamentos`,{method:"POST",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(paymentsPayload)});
      }
      setModal(null);show(`✅ Despesa: ${brl(val)} • ${pagsValidos.length} pagador(es)`);
      sync();
    }catch(e){show(`❌ ${e.message}`);}
  };
  const deleteCusto=async(c)=>{
    if(!confirm(`Excluir "${c.desp}"?\n\nRemove também os pagamentos vinculados.`))return;
    if(c._supaId){try{
      // CASCADE remove custo_pagamentos junto
      await fetch(`${SUPA_URL}/rest/v1/custos?id=eq.${c._supaId}`,{method:"DELETE",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Prefer":"return=minimal"}});
    }catch(e){console.warn(e);}}
    show("Removido");sync();
  };

  // ─── EDITAR DESPESA ───
  const[editCusto,setEditCusto]=useState(null);
  const[detalhesCusto,setDetalhesCusto]=useState(null);
  const openDetalhesCusto=(c)=>{setDetalhesCusto(c);setModal("detalhesCusto");};
  const openEditCusto=(c)=>{
    const pagsExist=custoPagamentos.filter(p=>p.custoId===c._supaId);
    setEditCusto({
      ...c,
      valor:String(c.valor||""),
      pagadores:pagsExist.length>0?pagsExist.map(p=>({
        _cpId:p._supaId,
        pagador:p.pagador,
        valorPago:String(p.valorPago),
        reembPendente:String(p.reembPendente),
        reembQuitado:p.reembQuitado,
      })):[{pagador:c.pag||"Kroc",valorPago:String(c.valor||0),reembPendente:String(c.pag==="Kroc"?0:c.valor||0)}]
    });
    setModal("editCusto");
  };
  const saveEditCusto=async()=>{
    if(!editCusto._supaId)return show("Erro: sem ID");
    const val=+editCusto.valor;
    if(!editCusto.desp||!val)return show("Preencha descrição e valor");
    const pagsValidos=(editCusto.pagadores||[]).filter(p=>p.pagador&&+p.valorPago>0);
    if(pagsValidos.length===0)return show("Adicione pelo menos 1 pagador com valor");
    const somaPago=pagsValidos.reduce((s,p)=>s+(+p.valorPago||0),0);
    if(Math.abs(somaPago-val)>0.01){
      if(!confirm(`⚠️ Soma dos pagamentos (${brl(somaPago)}) ≠ valor da despesa (${brl(val)}). Continuar assim?`))return;
    }
    try{
      // Patch do custo
      const patch={mes:mesAbrev(editCusto.data),data:editCusto.data,despesa:editCusto.desp,descricao:editCusto.desc||"",fornecedor:editCusto.forn||"",categoria:editCusto.cat,valor:val,pagador:pagsValidos[0].pagador,reemb:pagsValidos.reduce((s,p)=>s+(+p.reembPendente||0),0),recorrente:!!editCusto.recorrente};
      await fetch(`${SUPA_URL}/rest/v1/custos?id=eq.${editCusto._supaId}`,{method:"PATCH",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(patch)});
      // Remove pagamentos antigos e cria novos (abordagem simples)
      await fetch(`${SUPA_URL}/rest/v1/custo_pagamentos?custo_id=eq.${editCusto._supaId}`,{method:"DELETE",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Prefer":"return=minimal"}});
      const paymentsPayload=pagsValidos.map(p=>({
        custo_id:editCusto._supaId,
        pagador:p.pagador,
        valor_pago:+p.valorPago,
        valor_reemb_pendente:+p.reembPendente||(p.pagador==="Kroc"?0:+p.valorPago),
        valor_reemb_quitado:+p.reembQuitado||0,
      }));
      await fetch(`${SUPA_URL}/rest/v1/custo_pagamentos`,{method:"POST",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(paymentsPayload)});
      setModal(null);show(`✅ ${editCusto.desp} atualizado`);
      sync();
    }catch(e){show(`❌ ${e.message}`);}
  };

  // ─── MARCAR REEMBOLSO COMO PAGO ───
  const marcarReembolsoPago=async(cpId,valorPendente)=>{
    if(!confirm(`Marcar ${brl(valorPendente)} como pago?\n\nIsto move da coluna "pendente" pra "quitado".`))return;
    try{
      await fetch(`${SUPA_URL}/rest/v1/custo_pagamentos?id=eq.${cpId}`,{method:"PATCH",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({
        valor_reemb_pendente:0,
        valor_reemb_quitado:valorPendente,
        quitado_em:new Date().toISOString(),
        quitado_por:user?.email||"admin"
      })});
      show(`✅ ${brl(valorPendente)} quitado`);
      sync();
    }catch(e){show(`❌ ${e.message}`);}
  };
  const desmarcarReembolsoPago=async(cpId,valorQuitado)=>{
    if(!confirm(`Reverter quitação de ${brl(valorQuitado)}?`))return;
    try{
      await fetch(`${SUPA_URL}/rest/v1/custo_pagamentos?id=eq.${cpId}`,{method:"PATCH",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({
        valor_reemb_pendente:valorQuitado,
        valor_reemb_quitado:0,
        quitado_em:null,
        quitado_por:null
      })});
      show(`↩️ Quitação revertida`);
      sync();
    }catch(e){show(`❌ ${e.message}`);}
  };

  // ─── NOVA BAIXA (amostra, marketing, perda, cortesia) ───
  const[novaBaixa,setNovaBaixa]=useState(null);
  const openBaixa=()=>{setNovaBaixa({data:today(),motivo:"",cat:"Amostra",desc:"",destin:"",q40:0,q240:0,q500:0,qMel:0});setModal("baixa")};
  const saveBaixa=async()=>{
    if(!novaBaixa.motivo.trim())return show("Informe o motivo");
    const tot=(+novaBaixa.q40)+(+novaBaixa.q240)+(+novaBaixa.q500)+(+novaBaixa.qMel||0);
    if(tot<=0)return show("Informe ao menos 1 unidade");
    // FIFO: tenta alocar nos lotes mais antigos disponíveis (granola + mel separados)
    const{alocs,falta}=computeFIFO(+novaBaixa.q40,+novaBaixa.q240,+novaBaixa.q500,+novaBaixa.qMel||0);
    
    if(falta.q40+falta.q240+falta.q500+falta.qMel>0){
      const msg=`⚠️ Estoque insuficiente — faltam ${falta.q40?falta.q40+"×40g ":""}${falta.q240?falta.q240+"×240g ":""}${falta.q500?falta.q500+"×500g ":""}${falta.qMel?falta.qMel+"×Mel":""}.\n\nA baixa será forçada no lote mais antigo. Continuar?`;
      if(!confirm(msg))return;
      // Acha lote granola mais antigo (pra granola que faltou)
      if(falta.q40+falta.q240+falta.q500>0){
        const loteGranola=lotesCalc.filter(l=>!l.isMel).sort((a,b)=>(a.data||"").localeCompare(b.data||""))[0];
        if(loteGranola){
          const existing=alocs.find(a=>a.lote_id===loteGranola.id);
          if(existing){
            existing.qtd_40+=falta.q40;
            existing.qtd_240+=falta.q240;
            existing.qtd_500+=falta.q500;
          }else{
            alocs.push({lote_id:loteGranola.id,qtd_40:falta.q40,qtd_240:falta.q240,qtd_500:falta.q500,qtd_mel:0});
          }
        }
      }
      // Acha lote mel mais antigo (pra mel que faltou)
      if(falta.qMel>0){
        const loteMel=lotesCalc.filter(l=>l.isMel).sort((a,b)=>(a.data||"").localeCompare(b.data||""))[0];
        if(loteMel){
          const existing=alocs.find(a=>a.lote_id===loteMel.id);
          if(existing){
            existing.qtd_mel+=falta.qMel;
          }else{
            alocs.push({lote_id:loteMel.id,qtd_40:0,qtd_240:0,qtd_500:0,qtd_mel:falta.qMel});
          }
        }
      }
    }
    
    const custoMel=prodCusto.find(p=>p.sku==="MEL-300")?.custoTotal||25;
    const custo=(+novaBaixa.q40)*4.34+(+novaBaixa.q240)*16.64+(+novaBaixa.q500)*34.41+(+novaBaixa.qMel||0)*custoMel;
    const payload={data:novaBaixa.data,motivo:novaBaixa.motivo,categoria:novaBaixa.cat,descricao:novaBaixa.desc,destinatario:novaBaixa.destin,qtd_40:+novaBaixa.q40,qtd_240:+novaBaixa.q240,qtd_500:+novaBaixa.q500,qtd_mel:+novaBaixa.qMel||0,custo_total:custo};
    try{
      const r=await fetch(`${SUPA_URL}/rest/v1/baixas`,{method:"POST",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(payload)});
      if(!r.ok){const t=await r.text();show(`❌ ${r.status}: ${t.slice(0,80)}`);return;}
      const created=await r.json();
      const baixaId=Array.isArray(created)&&created[0]?created[0].id:null;
      // Grava alocações BX- na pedido_lotes (sempre que tiver alocs, mesmo parcial)
      if(baixaId&&alocs.length>0){
        await gravarAlocacoes(`BX-${baixaId}`,alocs);
      }else if(baixaId){
        console.warn("[saveBaixa] baixa criada sem alocação — estoque sem nenhum lote disponível");
      }
      const loteMsg=alocs.length>1?` • ${alocs.length} lotes`:alocs[0]?` • ${alocs[0].lote_id}`:" • sem lote";
      setModal(null);show(`✅ Baixa registrada — ${tot} un${loteMsg}`);
      sync();
    }catch(e){show(`❌ ${e.message}`);}
  };
  const deleteBaixa=async(b)=>{
    if(!confirm(`Excluir baixa "${b.motivo}"?`))return;
    if(b._supaId){
      try{
        // Remove alocações FIFO vinculadas
        await fetch(`${SUPA_URL}/rest/v1/pedido_lotes?pedido_num=eq.BX-${b._supaId}`,{method:"DELETE",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Prefer":"return=minimal"}});
        await fetch(`${SUPA_URL}/rest/v1/baixas?id=eq.${b._supaId}`,{method:"DELETE",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Prefer":"return=minimal"}});
      }catch(e){console.warn(e);}
    }
    setBaixas(p=>p.filter(x=>x._supaId!==b._supaId));show("Baixa excluída");sync();
  };

  // ═══ LOGIN ═══
  const[le,setLe]=useState(()=>{const h=LS("login_history",[]);return h[0]?.email||""});
  const[lp,setLp]=useState("");
  const[lerr,setLerr]=useState("");
  const[showPwd,setShowPwd]=useState(false);
  const[loginLoading,setLoginLoading]=useState(false);
  const[showHistory,setShowHistory]=useState(false);
  const[showForgot,setShowForgot]=useState(false);
  
  // Usuarios do Supabase (pra aba de perfis + auth)
  const[usuariosDb,setUsuariosDb]=useState([]);
  const[userEdit,setUserEdit]=useState(null);
  const saveUsuario=async()=>{
    const u=userEdit;
    if(!u.username||!u.nome||!u.senha)return show("Username, nome e senha obrigatórios");
    try{
      await fetch(`${SUPA_URL}/rest/v1/usuarios?id=eq.${u.id}`,{method:"PATCH",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({
        username:u.username,nome:u.nome,email:u.email||null,senha:u.senha,ativo:u.ativo!==false
      })});
      show(`✅ ${u.nome} atualizado`);
      setUserEdit(null);
      fetchUsuarios();
    }catch(e){show("❌ Erro: "+e.message);}
  };
  const fetchUsuarios=useCallback(async()=>{
    try{
      const r=await fetch(`${SUPA_URL}/rest/v1/usuarios?select=*&order=username.asc`,{headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`}});
      const arr=await r.json();
      if(Array.isArray(arr))setUsuariosDb(arr);
    }catch(e){console.warn("[usuarios] fetch erro:",e);}
  },[]);
  useEffect(()=>{if(user)fetchUsuarios()},[user]);
  
  const tentarLogin=async()=>{
    setLoginLoading(true);setLerr("");
    const email=le.trim().toLowerCase();
    const senha=lp;
    if(!email||!senha){setLerr("Preencha email e senha");setLoginLoading(false);return;}
    let userLogado=null;
    try{
      const r=await fetch(`${SUPA_URL}/rest/v1/usuarios?select=*&or=(email.eq.${encodeURIComponent(email)},username.eq.${encodeURIComponent(email)})`,{headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`}});
      const arr=await r.json();
      if(Array.isArray(arr)&&arr.length>0){
        const u=arr.find(x=>x.senha===senha&&x.ativo!==false);
        if(u){userLogado={email:u.email||u.username,nome:u.nome,username:u.username,_supaId:u.id};}
      }
    }catch(e){console.warn("[login] Supa erro, fallback hardcoded");}
    if(!userLogado){
      const u=USERS.find(u=>u.email===email&&u.senha===senha);
      if(u)userLogado={email:u.email,nome:u.nome};
    }
    setLoginLoading(false);
    if(userLogado){
      // Adiciona ao histórico (max 5, mais recente primeiro, sem duplicatas)
      const novoHistorico=[
        {email:userLogado.email,nome:userLogado.nome,quando:new Date().toISOString()},
        ...loginHistory.filter(h=>h.email!==userLogado.email)
      ].slice(0,5);
      setLoginHistory(novoHistorico);
      setUser(userLogado);
      setLp("");
    }else{
      setLerr("Email ou senha incorretos");
    }
  };
  
  if(!user)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${X.bg},#F0E8DD)`,fontFamily:f,padding:20}}>
    <div style={{width:"100%",maxWidth:420,padding:"40px 36px",background:X.card,borderRadius:16,boxShadow:"0 10px 50px rgba(0,0,0,0.10)",position:"relative"}}>
      {/* Logo + título */}
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:48,marginBottom:6}}>🥣</div>
        <h1 style={{fontSize:26,fontWeight:700,margin:"0 0 4px",letterSpacing:-0.5}}>Kroc Admin</h1>
        <p style={{fontSize:12,color:X.mut,margin:0}}>{showForgot?"Recuperação de senha":"Painel de gestão"}</p>
      </div>
      
      {showForgot?<>
        <div style={{padding:"14px 16px",background:"#FEF3C7",borderRadius:8,marginBottom:18,fontSize:12,color:"#B45309",lineHeight:1.5}}>
          🔐 Pra resetar sua senha, peça em pessoa pra outro sócio (Caio, Felipe ou Leo) acessar a aba <strong>Config → Usuários</strong> no admin e alterar diretamente.<br/><br/>
          Em breve teremos recuperação por email.
        </div>
        <button onClick={()=>{setShowForgot(false);setLerr("");}} style={{width:"100%",padding:"11px",background:"transparent",border:`1px solid ${X.bdr}`,borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",color:X.txt,fontFamily:f}}>← Voltar pro login</button>
      </>:<>
        {/* Histórico de logins recentes */}
        {loginHistory.length>0&&!showHistory&&<button onClick={()=>setShowHistory(true)} style={{width:"100%",padding:"10px 14px",background:X.bg,border:`1px solid ${X.bdr}`,borderRadius:8,fontSize:12,color:X.mut,cursor:"pointer",marginBottom:14,fontFamily:f,textAlign:"left",display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:16}}>👥</span>
          <span style={{flex:1}}>Login recente: <strong style={{color:X.txt}}>{loginHistory[0].nome}</strong></span>
          <span style={{fontSize:18}}>›</span>
        </button>}
        {showHistory&&<div style={{marginBottom:14,background:X.bg,borderRadius:8,border:`1px solid ${X.bdr}`,overflow:"hidden"}}>
          <div style={{padding:"8px 14px",borderBottom:`1px solid ${X.bdr}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:11,fontWeight:700,color:X.mut,textTransform:"uppercase",letterSpacing:.4}}>Logins recentes</span>
            <button onClick={()=>setShowHistory(false)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:X.mut,padding:"2px 6px"}}>✕</button>
          </div>
          {loginHistory.map((h,i)=>{
            const dt=new Date(h.quando);
            const agora=new Date();
            const diff=Math.floor((agora-dt)/86400000);
            const tempo=diff===0?"hoje":diff===1?"ontem":`${diff}d atrás`;
            return<button key={i} onClick={()=>{setLe(h.email);setShowHistory(false);setTimeout(()=>document.querySelector('input[type="password"]')?.focus(),50);}} style={{width:"100%",padding:"10px 14px",background:"transparent",border:"none",borderTop:i>0?`1px solid ${X.bdr}`:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:f,textAlign:"left"}} onMouseEnter={e=>e.currentTarget.style.background="#fff"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{width:32,height:32,borderRadius:"50%",background:X.acc,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700}}>{(h.nome||"?").charAt(0).toUpperCase()}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:X.txt}}>{h.nome}</div>
                <div style={{fontSize:11,color:X.mut,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{h.email}</div>
              </div>
              <div style={{fontSize:10,color:X.mut}}>{tempo}</div>
            </button>;
          })}
          <button onClick={()=>{if(confirm("Limpar histórico de logins?")){setLoginHistory([]);setShowHistory(false);}}} style={{width:"100%",padding:"8px 14px",background:"transparent",border:"none",borderTop:`1px solid ${X.bdr}`,cursor:"pointer",fontSize:11,color:X.mut,fontFamily:f,textAlign:"center"}}>🗑️ Limpar histórico</button>
        </div>}
        
        {/* Email */}
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:11,fontWeight:700,color:X.mut,textTransform:"uppercase",letterSpacing:.4,marginBottom:6}}>Email ou usuário</label>
          <input type="text" autoFocus value={le} onChange={e=>setLe(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")document.querySelector('input[type="password"]')?.focus();}} placeholder="caio@krocgranola.com" style={{width:"100%",padding:"11px 14px",fontSize:14,border:`1px solid ${lerr?X.red:X.bdr}`,borderRadius:8,fontFamily:f,boxSizing:"border-box",background:"#fff",outline:"none",transition:"border 0.15s"}} onFocus={e=>e.target.style.borderColor=X.acc} onBlur={e=>e.target.style.borderColor=lerr?X.red:X.bdr}/>
        </div>
        
        {/* Senha */}
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <label style={{fontSize:11,fontWeight:700,color:X.mut,textTransform:"uppercase",letterSpacing:.4}}>Senha</label>
            <button onClick={()=>setShowForgot(true)} style={{background:"none",border:"none",fontSize:11,color:X.acc,cursor:"pointer",fontWeight:600,padding:0,fontFamily:f}}>Esqueci a senha</button>
          </div>
          <div style={{position:"relative"}}>
            <input type={showPwd?"text":"password"} value={lp} onChange={e=>setLp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")tentarLogin();}} placeholder="••••••••" style={{width:"100%",padding:"11px 44px 11px 14px",fontSize:14,border:`1px solid ${lerr?X.red:X.bdr}`,borderRadius:8,fontFamily:f,boxSizing:"border-box",background:"#fff",outline:"none",transition:"border 0.15s"}} onFocus={e=>e.target.style.borderColor=X.acc} onBlur={e=>e.target.style.borderColor=lerr?X.red:X.bdr}/>
            <button type="button" onClick={()=>setShowPwd(!showPwd)} title={showPwd?"Esconder":"Mostrar"} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,padding:"6px 8px",color:X.mut}}>{showPwd?"🙈":"👁️"}</button>
          </div>
        </div>
        
        {/* Lembrar senha */}
        <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:18,cursor:"pointer",userSelect:"none"}}>
          <input type="checkbox" checked={lembrar} onChange={e=>setLembrar(e.target.checked)} style={{width:16,height:16,cursor:"pointer",accentColor:X.acc}}/>
          <span style={{fontSize:12,color:X.txt}}>Manter logado neste navegador</span>
        </label>
        
        {/* Erro */}
        {lerr&&<div style={{padding:"10px 14px",background:"#FEE2E2",border:`1px solid ${X.red}40`,borderRadius:8,marginBottom:14,fontSize:12,color:X.red,fontWeight:600,display:"flex",alignItems:"center",gap:8}}>
          <span>⚠️</span><span>{lerr}</span>
        </div>}
        
        {/* Botão entrar */}
        <button onClick={tentarLogin} disabled={loginLoading} style={{width:"100%",padding:"13px",background:loginLoading?X.mut:X.acc,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:loginLoading?"wait":"pointer",fontFamily:f,letterSpacing:.3,transition:"all 0.15s",boxShadow:loginLoading?"none":"0 2px 8px rgba(180,90,30,0.25)"}} onMouseEnter={e=>{if(!loginLoading)e.currentTarget.style.transform="translateY(-1px)";}} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
          {loginLoading?"⏳ Verificando...":"Entrar →"}
        </button>
        
        {/* Footer */}
        <p style={{fontSize:10,color:X.mut,textAlign:"center",margin:"24px 0 0",lineHeight:1.6}}>
          🔒 Conexão criptografada<br/>
          Kroc Granola © 2026 — APP Indústria e Comércio Ltda.
        </p>
      </>}
    </div>
  </div>;

  const tabs=[{id:"dashboard",icon:"📊",label:"Dashboard"},{id:"vendas",icon:"💰",label:"Vendas"},{id:"entregas",icon:"🛵",label:"Entregas",badge:stats.pend},{id:"estoque",icon:"📦",label:"Estoque",badge:pendProducao.length||0},{id:"clientes",icon:"👤",label:"Clientes"},{id:"custos",icon:"💸",label:"Custos"},{id:"cupons",icon:"🎟️",label:"Cupons"},{id:"dfs",icon:"📈",label:"DFs"},{id:"config",icon:"⚙️",label:"Config"}];

  const sortFn=(a,b)=>{
    if(sortBy==="id")return a.id.localeCompare(b.id);
    if(sortBy==="id_desc")return b.id.localeCompare(a.id);
    if(sortBy==="data")return(a.data||"").localeCompare(b.data||"");
    if(sortBy==="data_desc")return(b.data||"").localeCompare(a.data||"");
    if(sortBy==="comp")return(a.comp||"").localeCompare(b.comp||"");
    if(sortBy==="rec")return b.rec-a.rec;
    if(sortBy==="lucro")return b.lucro-a.lucro;
    return 0;
  };
  const filtV=vendas.filter(v=>!search||v.comp.toLowerCase().includes(search.toLowerCase())||v.id.toLowerCase().includes(search.toLowerCase())).sort(sortFn);

  return<div style={{display:"flex",minHeight:"100vh",fontFamily:f,color:X.txt,background:X.bg}}>
    {/* SIDEBAR */}
    <div style={{width:200,background:X.sb,display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{padding:"20px 16px 24px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:22}}>🥣</span><div><h2 style={{margin:0,fontSize:16,fontWeight:700,color:"#FFF"}}>Kroc</h2><p style={{margin:0,fontSize:10,color:X.sbT}}>Sistema de Gestão</p></div></div></div>
      <nav style={{padding:"12px 8px",flex:1}}>{tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"9px 10px",marginBottom:2,borderRadius:6,border:"none",background:tab===t.id?"rgba(200,118,45,0.15)":"transparent",color:tab===t.id?X.sbA:X.sbT,fontSize:13,fontWeight:tab===t.id?600:400,cursor:"pointer",fontFamily:f,textAlign:"left"}}><span style={{fontSize:14}}>{t.icon}</span>{t.label}{t.badge>0&&<span style={{marginLeft:"auto",fontSize:10,fontWeight:700,background:X.acc,color:"#FFF",padding:"1px 6px",borderRadius:8}}>{t.badge}</span>}</button>)}</nav>
      <div style={{padding:"8px",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
        <button onClick={sync} disabled={apiSt==="loading"} style={{width:"100%",padding:"8px 10px",marginBottom:4,borderRadius:6,border:"none",background:apiSt==="ok"?"rgba(22,163,74,0.15)":apiSt==="error"?"rgba(220,38,38,0.15)":"rgba(255,255,255,0.08)",color:apiSt==="ok"?"#4ADE80":apiSt==="error"?"#FCA5A5":X.sbT,fontSize:11,cursor:"pointer",fontFamily:f,textAlign:"left"}}>{apiSt==="loading"?"⏳ Sincronizando...":apiSt==="ok"?"🟢 Conectado":"⚪ Sincronizar"}</button>
        {lastSync&&<p style={{padding:"0 10px",margin:"0 0 4px",fontSize:9,color:"rgba(255,255,255,0.2)"}}>Sync: {new Date(lastSync).toLocaleString("pt-BR")}</p>}
        <p style={{padding:"4px 10px",margin:0,fontSize:11,color:X.sbT}}>{user.nome}</p>
        <div style={{display:"flex",gap:4,marginTop:4}}><button onClick={()=>{if(confirm("Resetar dados?")){localStorage.clear();location.reload()}}} style={{flex:1,padding:"6px",borderRadius:6,border:"none",background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.3)",fontSize:10,cursor:"pointer",fontFamily:f}}>Reset</button><button onClick={()=>setUser(null)} style={{flex:1,padding:"6px",borderRadius:6,border:"none",background:"rgba(255,255,255,0.05)",color:X.sbT,fontSize:11,cursor:"pointer",fontFamily:f}}>Sair</button></div>
      </div>
    </div>

    {/* MAIN */}
    <div style={{flex:1,overflow:"auto"}}><div style={{maxWidth:1200,margin:"0 auto",padding:"24px 28px"}}>

    {/* ══ DASHBOARD ══ */}
    {tab==="dashboard"&&<>
      <h1 style={{fontSize:22,fontWeight:700,margin:"0 0 20px"}}>Dashboard — {fdt(today())}</h1>
      
      {/* Linha 1: KPIs financeiros principais */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:14,marginBottom:14}}>
        {[
          ["📋 Vendas",stats.tot,null,X.txt],
          ["💰 Receita",brl(stats.rec),null,X.acc],
          ["📈 Lucro",brl(stats.luc),stats.margem>0?`margem ${stats.margem.toFixed(1)}%`:null,stats.luc>=0?X.grn:X.red],
          ["💸 Custos",brl(stats.custoTot),null,X.mut],
          ["🎯 Ticket médio",brl(stats.ticketMedio),null,X.txt],
        ].map(([l,v,sub,cor],i)=><div key={i} style={{padding:"16px 20px",background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`}}>
          <p style={{fontSize:11,color:X.mut,margin:0}}>{l}</p>
          <p style={{fontSize:22,fontWeight:700,margin:"6px 0 0",color:cor}}>{v}</p>
          {sub&&<p style={{fontSize:10,color:X.mut,margin:"2px 0 0"}}>{sub}</p>}
        </div>)}
      </div>
      
      {/* Linha 2: Produtos vendidos */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:14,marginBottom:14}}>
        <div style={{padding:"14px 20px",background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`}}>
          <p style={{fontSize:11,color:X.mut,margin:0}}>📦 Pacotes vendidos</p>
          <p style={{fontSize:22,fontWeight:700,margin:"6px 0 0"}}>{stats.pacs}</p>
          <p style={{fontSize:10,color:X.mut,margin:"2px 0 0",fontFamily:mo}}>{stats.pacs40>0?`${stats.pacs40}×40g `:""}{stats.pacs240>0?`${stats.pacs240}×240g `:""}{stats.pacs500>0?`${stats.pacs500}×500g`:""}</p>
        </div>
        <div style={{padding:"14px 20px",background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`}}>
          <p style={{fontSize:11,color:X.mut,margin:0}}>⚖️ Granola total</p>
          <p style={{fontSize:22,fontWeight:700,margin:"6px 0 0",fontFamily:mo}}>{stats.kgTotal.toFixed(1)} kg</p>
          <p style={{fontSize:10,color:X.mut,margin:"2px 0 0"}}>equivalente em peso</p>
        </div>
        <div style={{padding:"14px 20px",background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`}}>
          <p style={{fontSize:11,color:X.mut,margin:0}}>👤 Clientes</p>
          <p style={{fontSize:22,fontWeight:700,margin:"6px 0 0"}}>{stats.cli}</p>
          <p style={{fontSize:10,color:X.mut,margin:"2px 0 0"}}>{stats.novosMes>0?`+${stats.novosMes} novos no mês`:"—"}</p>
        </div>
        <div style={{padding:"14px 20px",background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`}}>
          <p style={{fontSize:11,color:X.mut,margin:0}}>🛵 Entregas pendentes</p>
          <p style={{fontSize:22,fontWeight:700,margin:"6px 0 0",color:stats.pend>0?X.red:X.grn}}>{stats.pend}</p>
          <p style={{fontSize:10,color:X.mut,margin:"2px 0 0"}}>{stats.pend===0?"tudo em dia":"aguardando entrega"}</p>
        </div>
      </div>
      
      {/* Linha 3: Períodos */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:24}}>
        <div style={{padding:"14px 20px",background:"#FEF3C7",borderRadius:10,border:`1px solid #F59E0B40`}}>
          <p style={{fontSize:11,color:"#B45309",margin:0,fontWeight:700,textTransform:"uppercase",letterSpacing:.3}}>HOJE</p>
          <p style={{fontSize:20,fontWeight:700,margin:"6px 0 0",fontFamily:mo,color:"#B45309"}}>{brl(stats.hoje.rec)}</p>
          <p style={{fontSize:11,color:"#B45309",margin:"2px 0 0"}}>{stats.hoje.qtd} venda{stats.hoje.qtd!==1?"s":""}</p>
        </div>
        <div style={{padding:"14px 20px",background:"#DBEAFE",borderRadius:10,border:`1px solid #2563EB40`}}>
          <p style={{fontSize:11,color:"#1E40AF",margin:0,fontWeight:700,textTransform:"uppercase",letterSpacing:.3}}>ÚLTIMOS 7 DIAS</p>
          <p style={{fontSize:20,fontWeight:700,margin:"6px 0 0",fontFamily:mo,color:"#1E40AF"}}>{brl(stats.sem.rec)}</p>
          <p style={{fontSize:11,color:"#1E40AF",margin:"2px 0 0"}}>{stats.sem.qtd} vendas • lucro <span style={{color:stats.sem.luc>=0?X.grn:X.red,fontWeight:700}}>{brl(stats.sem.luc)}</span></p>
        </div>
        <div style={{padding:"14px 20px",background:"#F3E8FF",borderRadius:10,border:`1px solid #7C3AED40`}}>
          <p style={{fontSize:11,color:"#6B21A8",margin:0,fontWeight:700,textTransform:"uppercase",letterSpacing:.3}}>ÚLTIMOS 30 DIAS</p>
          <p style={{fontSize:20,fontWeight:700,margin:"6px 0 0",fontFamily:mo,color:"#6B21A8"}}>{brl(stats.mes.rec)}</p>
          <p style={{fontSize:11,color:"#6B21A8",margin:"2px 0 0"}}>{stats.mes.qtd} vendas • lucro <span style={{color:stats.mes.luc>=0?X.grn:X.red,fontWeight:700}}>{brl(stats.mes.luc)}</span></p>
        </div>
      </div>
      {reemb.length>0&&<div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,padding:20,marginBottom:20}}><h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:600}}>💸 Reembolsos</h3><div style={{display:"flex",gap:12}}>{reemb.map(r=><div key={r.p} style={{flex:1,padding:"12px 16px",background:"#FEF2F2",borderRadius:8}}><p style={{margin:0,fontWeight:600}}>{r.p}</p><p style={{margin:"4px 0 0",fontSize:18,fontWeight:700,fontFamily:mo,color:X.red}}>{brl(r.t)}</p></div>)}</div></div>}
      {/* Estoque disponível */}
      <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,padding:20,marginBottom:20}}>
        <h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:600}}>📦 Estoque Disponível para Venda</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14}}>
          {[["40g",estoqueTotal.d40,"#F59E0B","#FEF3C7",false],["240g",estoqueTotal.d240,"#2563EB","#DBEAFE",false],["500g",estoqueTotal.d500,"#7C3AED","#F3E8FF",false],["Mel 300g",estoqueTotal.dMel,"#CA8A04","#FEF9C3",false]].map(([tag,qtd,cor,bg,desativado])=>(
            <div key={tag} style={{flex:1,padding:"14px 18px",background:desativado?"#F3F4F6":(qtd<=0?"#FEE2E2":bg),borderRadius:10,border:`2px solid ${desativado?"#D1D5DB":(qtd<=0?X.red:cor)}40`,textAlign:"center",opacity:desativado?.55:1}}>
              <p style={{margin:0,fontSize:28,fontWeight:800,fontFamily:mo,color:desativado?"#9CA3AF":(qtd<=0?X.red:cor)}}>{qtd}</p>
              <p style={{margin:"4px 0 0",fontSize:13,fontWeight:600,color:desativado?"#6B7280":(qtd<=0?X.red:cor)}}>{tag}{desativado?" (pausado)":""}</p>
              {!desativado&&qtd<=0&&<p style={{margin:"4px 0 0",fontSize:11,fontWeight:700,color:X.red}}>⚠️ PRODUZIR</p>}
            </div>
          ))}
        </div>
      </div>
      {/* ═══ GRÁFICOS E ANÁLISES ═══ */}
      {dashboardData.dias.some(d=>d.receita>0)&&<>
        {/* Filtros ativos — chips clicáveis pra remover */}
        {dashboardData.filtrosAtivos&&<div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:X.mut,fontWeight:600,textTransform:"uppercase",letterSpacing:.4}}>Filtros:</span>
          {dashFiltroMes&&<button onClick={()=>setDashFiltroMes(null)} style={{padding:"4px 10px",background:X.acc+"15",color:X.acc,border:`1px solid ${X.acc}40`,borderRadius:14,fontSize:11,fontWeight:600,cursor:"pointer"}}>📅 {(()=>{const [y,m]=dashFiltroMes.split("-");return ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][+m-1]+" "+y;})()} ✕</button>}
          {dashFiltroSku&&<button onClick={()=>setDashFiltroSku(null)} style={{padding:"4px 10px",background:X.acc+"15",color:X.acc,border:`1px solid ${X.acc}40`,borderRadius:14,fontSize:11,fontWeight:600,cursor:"pointer"}}>📦 {dashFiltroSku} ✕</button>}
          {dashFiltroCanal&&<button onClick={()=>setDashFiltroCanal(null)} style={{padding:"4px 10px",background:X.acc+"15",color:X.acc,border:`1px solid ${X.acc}40`,borderRadius:14,fontSize:11,fontWeight:600,cursor:"pointer"}}>📺 {dashFiltroCanal} ✕</button>}
          <button onClick={()=>{setDashFiltroMes(null);setDashFiltroSku(null);setDashFiltroCanal(null);}} style={{padding:"4px 10px",background:"transparent",color:X.mut,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",textDecoration:"underline"}}>Limpar tudo</button>
        </div>}

        {/* Gráfico de receita — interativo */}
        <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,padding:20,marginBottom:20,position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
            <h3 style={{margin:0,fontSize:14,fontWeight:700}}>📈 Receita & Lucro</h3>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:11,color:X.mut}}>
                Crescimento mês: 
                <strong style={{marginLeft:6,color:dashboardData.crescimentoPct>=0?X.grn:X.red}}>
                  {dashboardData.crescimentoPct>=0?"+":""}{dashboardData.crescimentoPct.toFixed(1)}%
                </strong>
              </span>
              {/* Toggle período */}
              <div style={{display:"flex",background:X.bg,borderRadius:6,padding:2,border:`1px solid ${X.bdr}`}}>
                {[7,30,90,"all"].map(p=><button key={p} onClick={()=>setDashPeriodo(p)} style={{background:dashPeriodo===p?X.card:"transparent",border:"none",padding:"4px 10px",borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:600,color:dashPeriodo===p?X.txt:X.mut,boxShadow:dashPeriodo===p?"0 1px 2px rgba(0,0,0,0.08)":"none"}}>{p==="all"?"Tudo":p+"d"}</button>)}
              </div>
            </div>
          </div>
          <div style={{position:"relative"}}>
          {(()=>{
            const dias=dashboardData.dias;
            const W=900,H=260,padL=50,padR=20,padT=10,padB=30;
            const maxRec=Math.max(...dias.map(d=>d.receita),1);
            const minLuc=Math.min(...dias.map(d=>d.lucro),0);
            const maxLuc=Math.max(...dias.map(d=>d.lucro),1);
            const escala=Math.max(maxRec,maxLuc);
            const range=escala-Math.min(minLuc,0);
            const yScale=v=>padT+(H-padT-padB)-((v-Math.min(minLuc,0))/range)*(H-padT-padB);
            const xScale=i=>padL+(i/Math.max(1,dias.length-1))*(W-padL-padR);
            const pathRec=dias.map((d,i)=>`${i===0?"M":"L"} ${xScale(i)} ${yScale(d.receita)}`).join(" ");
            const pathLuc=dias.map((d,i)=>`${i===0?"M":"L"} ${xScale(i)} ${yScale(d.lucro)}`).join(" ");
            const yTicks=5;
            // Largura do bin pro hover (cada dia tem uma área transparente clicável/hover)
            const binW=(W-padL-padR)/Math.max(1,dias.length);
            return<svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",display:"block",userSelect:"none"}} preserveAspectRatio="none" onMouseLeave={()=>setDashHover(null)}>
              {/* Grid horizontal */}
              {[...Array(yTicks)].map((_,i)=>{
                const val=Math.min(minLuc,0)+(range/(yTicks-1))*i;
                const y=yScale(val);
                return<g key={i}>
                  <line x1={padL} y1={y} x2={W-padR} y2={y} stroke={X.bdr} strokeWidth="0.5" strokeDasharray="2 2"/>
                  <text x={padL-8} y={y+3} textAnchor="end" fontSize="9" fill={X.mut} fontFamily={mo}>{(val/1000).toFixed(1)}k</text>
                </g>;
              })}
              {/* Linha 0 */}
              <line x1={padL} y1={yScale(0)} x2={W-padR} y2={yScale(0)} stroke={X.mut} strokeWidth="1"/>
              {/* Área receita */}
              <path d={`${pathRec} L ${xScale(dias.length-1)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`} fill={X.acc} fillOpacity="0.1"/>
              {/* Linha receita */}
              <path d={pathRec} fill="none" stroke={X.acc} strokeWidth="2"/>
              {/* Linha lucro */}
              <path d={pathLuc} fill="none" stroke={X.grn} strokeWidth="2" strokeDasharray="4 3"/>
              {/* Pontos visíveis nos dias com venda */}
              {dias.map((d,i)=>{
                if(d.qtd===0)return null;
                const isHover=dashHover&&dashHover.tipo==="dia"&&dashHover.i===i;
                return<g key={i}>
                  <circle cx={xScale(i)} cy={yScale(d.receita)} r={isHover?5:3} fill={X.acc}/>
                  <circle cx={xScale(i)} cy={yScale(d.lucro)} r={isHover?4:2} fill={X.grn}/>
                </g>;
              })}
              {/* Labels eixo X */}
              {dias.map((d,i)=>{
                const step=dias.length<=14?2:dias.length<=40?5:dias.length<=100?10:30;
                if(i%step!==0&&i!==dias.length-1)return null;
                return<text key={i} x={xScale(i)} y={H-12} textAnchor="middle" fontSize="9" fill={X.mut} fontFamily={mo}>{d.label}</text>;
              })}
              {/* Linha vertical de hover */}
              {dashHover&&dashHover.tipo==="dia"&&<line x1={xScale(dashHover.i)} y1={padT} x2={xScale(dashHover.i)} y2={H-padB} stroke={X.acc} strokeWidth="1" strokeDasharray="3 3" opacity="0.5"/>}
              {/* Áreas invisíveis pra hover/click */}
              {dias.map((d,i)=><rect key={i} x={xScale(i)-binW/2} y={padT} width={binW} height={H-padT-padB} fill="transparent" style={{cursor:"crosshair"}} onMouseEnter={()=>setDashHover({tipo:"dia",i,d})} onClick={()=>setDashFiltroMes(d.data.slice(0,7))}/>)}
            </svg>;
          })()}
          {/* Tooltip flutuante */}
          {dashHover&&dashHover.tipo==="dia"&&<div style={{position:"absolute",top:6,right:24,background:"rgba(20,20,20,0.92)",color:"#fff",padding:"8px 12px",borderRadius:6,fontSize:11,pointerEvents:"none",zIndex:5,minWidth:160,backdropFilter:"blur(4px)"}}>
            <div style={{fontFamily:mo,fontSize:10,color:"#aaa",marginBottom:4}}>{dashHover.d.label} {dashHover.d.data.slice(0,4)}</div>
            <div style={{display:"flex",justifyContent:"space-between",gap:10}}><span style={{color:"#FCD34D"}}>Receita</span><span style={{fontFamily:mo,fontWeight:700}}>{brl(dashHover.d.receita)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",gap:10}}><span style={{color:"#86EFAC"}}>Lucro</span><span style={{fontFamily:mo,fontWeight:700}}>{brl(dashHover.d.lucro)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",gap:10,borderTop:"1px solid #444",paddingTop:4,marginTop:4}}><span style={{color:"#aaa"}}>Pedidos</span><span style={{fontFamily:mo}}>{dashHover.d.qtd}</span></div>
            <div style={{fontSize:9,color:"#666",marginTop:6,textAlign:"center"}}>Clique pra filtrar este mês</div>
          </div>}
          </div>
          <div style={{display:"flex",gap:16,marginTop:8,fontSize:11,color:X.mut,justifyContent:"center"}}>
            <span><span style={{display:"inline-block",width:10,height:2,background:X.acc,marginRight:6,verticalAlign:"middle"}}></span>Receita</span>
            <span><span style={{display:"inline-block",width:10,height:2,background:X.grn,borderTop:`2px dashed ${X.grn}`,marginRight:6,verticalAlign:"middle"}}></span>Lucro</span>
          </div>
        </div>

        {/* Linha: 3 colunas — Distribuição SKU, Distribuição Canal, Distribuição Pagamento */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14,marginBottom:20}}>
          {/* SKU */}
          <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,padding:18}}>
            <h3 style={{margin:"0 0 14px",fontSize:13,fontWeight:700}}>📦 Receita por Tamanho</h3>
            {(()=>{
              const dados=[
                {label:"40g",val:dashboardData.recBySku["40g"],cor:"#F59E0B"},
                {label:"240g",val:dashboardData.recBySku["240g"],cor:"#2563EB"},
                {label:"500g",val:dashboardData.recBySku["500g"],cor:"#7C3AED"},
                {label:"Mel 300g",val:dashboardData.recBySku["Mel 300g"]||0,cor:"#CA8A04"}
              ];
              const total=dashboardData.totalSku;
              return<>
                {total>0&&(()=>{
                  const cx=80,cy=80,rOut=70,rIn=42;
                  let acumA=-Math.PI/2;
                  const segs=[];
                  dados.forEach((d,i)=>{
                    if(d.val<=0){acumA+=0.0001;return;}
                    const angle=(d.val/total)*Math.PI*2;
                    const a1=acumA,a2=acumA+angle;
                    // Hover: empurra o segmento pra fora
                    const isHover=dashHover&&dashHover.tipo==="sku"&&dashHover.label===d.label;
                    const offset=isHover?6:0;
                    const midA=(a1+a2)/2;
                    const ox=offset*Math.cos(midA),oy=offset*Math.sin(midA);
                    const x1=cx+ox+rOut*Math.cos(a1),y1=cy+oy+rOut*Math.sin(a1);
                    const x2=cx+ox+rOut*Math.cos(a2),y2=cy+oy+rOut*Math.sin(a2);
                    const x3=cx+ox+rIn*Math.cos(a2),y3=cy+oy+rIn*Math.sin(a2);
                    const x4=cx+ox+rIn*Math.cos(a1),y4=cy+oy+rIn*Math.sin(a1);
                    const large=angle>Math.PI?1:0;
                    const path=`M ${x1} ${y1} A ${rOut} ${rOut} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${large} 0 ${x4} ${y4} Z`;
                    segs.push(<path key={i} d={path} fill={d.cor} style={{cursor:"pointer",transition:"all 0.18s"}} onMouseEnter={()=>setDashHover({tipo:"sku",label:d.label,val:d.val,pct:(d.val/total*100)})} onMouseLeave={()=>setDashHover(null)} onClick={()=>setDashFiltroSku(dashFiltroSku===d.label?null:d.label)}/>);
                    acumA=a2;
                  });
                  const centroLabel=dashHover&&dashHover.tipo==="sku"?dashHover.label:"Total";
                  const centroVal=dashHover&&dashHover.tipo==="sku"?brl(dashHover.val).replace("R$ ",""):brl(total).replace("R$ ","");
                  const centroSub=dashHover&&dashHover.tipo==="sku"?dashHover.pct.toFixed(1)+"%":"";
                  return<svg viewBox="0 0 160 160" style={{width:160,height:160,margin:"0 auto",display:"block"}}>
                    {segs}
                    <text x={cx} y={cy-8} textAnchor="middle" fontSize="9" fill={X.mut}>{centroLabel}</text>
                    <text x={cx} y={cy+6} textAnchor="middle" fontSize="13" fontWeight="700" fontFamily={mo}>{centroVal}</text>
                    {centroSub&&<text x={cx} y={cy+18} textAnchor="middle" fontSize="9" fontWeight="700" fontFamily={mo} fill={X.acc}>{centroSub}</text>}
                  </svg>;
                })()}
                <div style={{marginTop:10}}>
                  {dados.map(d=>{
                    const ativo=dashFiltroSku===d.label;
                    return<div key={d.label} onClick={()=>setDashFiltroSku(ativo?null:d.label)} onMouseEnter={()=>setDashHover({tipo:"sku",label:d.label,val:d.val,pct:total>0?d.val/total*100:0})} onMouseLeave={()=>setDashHover(null)} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",marginBottom:4,fontSize:11,cursor:"pointer",borderRadius:6,background:ativo?d.cor+"20":"transparent",border:`1px solid ${ativo?d.cor:"transparent"}`,transition:"all 0.15s"}}>
                      <div style={{width:12,height:12,background:d.cor,borderRadius:2}}></div>
                      <span style={{flex:1,fontWeight:600}}>{d.label}</span>
                      <span style={{fontFamily:mo,color:X.mut}}>{total>0?(d.val/total*100).toFixed(1):"0"}%</span>
                      <span style={{fontFamily:mo,fontWeight:700,minWidth:60,textAlign:"right"}}>{brl(d.val)}</span>
                    </div>;
                  })}
                </div>
                <p style={{fontSize:10,color:X.mut,textAlign:"center",margin:"8px 0 0",fontStyle:"italic"}}>Clique pra filtrar</p>
              </>;
            })()}
          </div>

          {/* Canal */}
          <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,padding:18}}>
            <h3 style={{margin:"0 0 14px",fontSize:13,fontWeight:700}}>📺 Receita por Canal</h3>
            {dashboardData.canais.length===0?<p style={{fontSize:12,color:X.mut,margin:0}}>—</p>:<>{dashboardData.canais.slice(0,6).map(([canal,val],i)=>{
              const pct=dashboardData.totalCanal>0?val/dashboardData.totalCanal*100:0;
              const cores=["#0EA5E9","#10B981","#F59E0B","#EF4444","#8B5CF6","#6B7280"];
              const ativo=dashFiltroCanal===canal;
              return<div key={i} onClick={()=>setDashFiltroCanal(ativo?null:canal)} style={{marginBottom:8,cursor:"pointer",padding:"4px 6px",borderRadius:5,background:ativo?cores[i%cores.length]+"15":"transparent",border:`1px solid ${ativo?cores[i%cores.length]:"transparent"}`,transition:"all 0.15s"}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
                  <span style={{fontWeight:600}}>{canal}</span>
                  <span style={{fontFamily:mo,color:X.mut}}>{brl(val)} ({pct.toFixed(0)}%)</span>
                </div>
                <div style={{height:8,background:X.bg,borderRadius:4,overflow:"hidden"}}>
                  <div style={{width:`${pct}%`,height:"100%",background:cores[i%cores.length],borderRadius:4,transition:"width 0.3s"}}></div>
                </div>
              </div>;
            })}<p style={{fontSize:10,color:X.mut,textAlign:"center",margin:"6px 0 0",fontStyle:"italic"}}>Clique pra filtrar</p></>}
          </div>

          {/* Método pagamento */}
          <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,padding:18}}>
            <h3 style={{margin:"0 0 14px",fontSize:13,fontWeight:700}}>💳 Receita por Pagamento</h3>
            {dashboardData.metodos.length===0?<p style={{fontSize:12,color:X.mut,margin:0}}>—</p>:dashboardData.metodos.slice(0,6).map(([met,val],i)=>{
              const totalMet=dashboardData.metodos.reduce((s,[,v])=>s+v,0);
              const pct=totalMet>0?val/totalMet*100:0;
              const cores=["#10B981","#0EA5E9","#F59E0B","#8B5CF6","#EF4444","#6B7280"];
              return<div key={i} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
                  <span style={{fontWeight:600}}>{met}</span>
                  <span style={{fontFamily:mo,color:X.mut}}>{brl(val)} ({pct.toFixed(0)}%)</span>
                </div>
                <div style={{height:8,background:X.bg,borderRadius:4,overflow:"hidden"}}>
                  <div style={{width:`${pct}%`,height:"100%",background:cores[i%cores.length],borderRadius:4,transition:"width 0.3s"}}></div>
                </div>
              </div>;
            })}
          </div>
        </div>

        {/* Top 10 clientes + Receita por mês */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(360px,1fr))",gap:14,marginBottom:20}}>
          {/* Top 10 */}
          <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,padding:18}}>
            <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:14}}>
              <h3 style={{margin:0,fontSize:13,fontWeight:700}}>🏆 Top 10 Clientes</h3>
              <span style={{fontSize:10,color:X.mut}}>{dashboardData.recorrentes} recorrentes • {dashboardData.unicos} únicos</span>
            </div>
            {dashboardData.topClientes.length===0?<p style={{fontSize:12,color:X.mut,margin:0}}>—</p>:<div>
              {dashboardData.topClientes.map((c,i)=>{
                const max=dashboardData.topClientes[0]?.receita||1;
                const pct=c.receita/max*100;
                return<div key={i} onClick={()=>{setTab("clientes");}} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 8px",borderBottom:i<dashboardData.topClientes.length-1?`1px solid ${X.bdr}`:"none",cursor:"pointer",borderRadius:4,transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background=X.bg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{width:22,fontSize:11,fontWeight:700,color:i<3?X.acc:X.mut,textAlign:"center"}}>{i<3?["🥇","🥈","🥉"][i]:`${i+1}.`}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.nome}</div>
                    <div style={{height:4,background:X.bg,borderRadius:2,overflow:"hidden",marginTop:3}}>
                      <div style={{width:`${pct}%`,height:"100%",background:X.acc,borderRadius:2,transition:"width 0.3s"}}></div>
                    </div>
                  </div>
                  <div style={{textAlign:"right",minWidth:90}}>
                    <div style={{fontSize:12,fontFamily:mo,fontWeight:700,color:X.acc}}>{brl(c.receita)}</div>
                    <div style={{fontSize:9,color:X.mut}}>{c.pedidos} pedido{c.pedidos!==1?"s":""} • {c.pacs} pacs</div>
                  </div>
                </div>;
              })}
            </div>}
          </div>

          {/* Receita por mês — barras */}
          <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,padding:18,position:"relative"}}>
            <h3 style={{margin:"0 0 14px",fontSize:13,fontWeight:700}}>📅 Receita por Mês</h3>
            {dashboardData.mesesData.length===0?<p style={{fontSize:12,color:X.mut,margin:0}}>—</p>:(()=>{
              const meses=dashboardData.mesesData;
              const W=400,H=210,padL=40,padR=10,padT=10,padB=40;
              const maxV=Math.max(...meses.map(m=>m.receita),1);
              const barW=(W-padL-padR)/meses.length*0.7;
              const gap=(W-padL-padR)/meses.length*0.3;
              const yScale=v=>padT+(H-padT-padB)-(v/maxV)*(H-padT-padB);
              const nomeM=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
              return<svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",display:"block"}} preserveAspectRatio="none" onMouseLeave={()=>setDashHover(null)}>
                {[0,0.25,0.5,0.75,1].map((p,i)=>{
                  const y=yScale(maxV*p);
                  return<g key={i}>
                    <line x1={padL} y1={y} x2={W-padR} y2={y} stroke={X.bdr} strokeWidth="0.5" strokeDasharray="2 2"/>
                    <text x={padL-6} y={y+3} textAnchor="end" fontSize="9" fill={X.mut} fontFamily={mo}>{(maxV*p/1000).toFixed(1)}k</text>
                  </g>;
                })}
                {meses.map((m,i)=>{
                  const x=padL+i*((W-padL-padR)/meses.length)+gap/2;
                  const yRec=yScale(m.receita);
                  const yLuc=yScale(Math.max(0,m.lucro));
                  const recH=padT+(H-padT-padB)-yRec;
                  const lucH=padT+(H-padT-padB)-yLuc;
                  const mn=parseInt(m.mes.slice(5,7))-1;
                  const ativo=dashFiltroMes===m.mes;
                  const isHover=dashHover&&dashHover.tipo==="mes"&&dashHover.mes===m.mes;
                  return<g key={i} style={{cursor:"pointer"}} onMouseEnter={()=>setDashHover({tipo:"mes",mes:m.mes,m})} onClick={()=>setDashFiltroMes(ativo?null:m.mes)}>
                    {/* Hitbox transparente cobrindo a coluna toda */}
                    <rect x={x-gap/2} y={padT} width={barW+gap} height={H-padT-padB} fill={isHover?X.acc:"transparent"} fillOpacity={isHover?0.06:0}/>
                    <rect x={x} y={yRec} width={barW} height={recH} fill={X.acc} fillOpacity={ativo||isHover?1:0.85} stroke={ativo?X.txt:"none"} strokeWidth={ativo?2:0}/>
                    {m.lucro>0&&<rect x={x+barW*0.6} y={yLuc} width={barW*0.4} height={lucH} fill={X.grn} fillOpacity={ativo||isHover?1:0.9}/>}
                    <text x={x+barW/2} y={H-22} textAnchor="middle" fontSize="9" fill={ativo?X.txt:X.mut} fontFamily={mo} fontWeight={ativo?700:400}>{nomeM[mn]}</text>
                    <text x={x+barW/2} y={H-10} textAnchor="middle" fontSize="9" fontWeight="700" fontFamily={mo} fill={ativo?X.acc:X.txt}>{brl(m.receita).replace("R$ ","").replace(",00","")}</text>
                  </g>;
                })}
              </svg>;
            })()}
            {dashHover&&dashHover.tipo==="mes"&&<div style={{position:"absolute",top:8,right:12,background:"rgba(20,20,20,0.92)",color:"#fff",padding:"7px 11px",borderRadius:6,fontSize:11,minWidth:150,pointerEvents:"none",zIndex:5}}>
              <div style={{fontFamily:mo,fontSize:10,color:"#aaa",marginBottom:3}}>{(()=>{const [y,m]=dashHover.mes.split("-");return["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][+m-1]+" "+y;})()}</div>
              <div style={{display:"flex",justifyContent:"space-between",gap:10}}><span style={{color:"#FCD34D"}}>Receita</span><span style={{fontFamily:mo,fontWeight:700}}>{brl(dashHover.m.receita)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",gap:10}}><span style={{color:"#86EFAC"}}>Lucro</span><span style={{fontFamily:mo,fontWeight:700}}>{brl(dashHover.m.lucro)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",gap:10,borderTop:"1px solid #444",paddingTop:3,marginTop:3}}><span style={{color:"#aaa"}}>Pedidos</span><span style={{fontFamily:mo}}>{dashHover.m.qtd}</span></div>
            </div>}
            <div style={{display:"flex",gap:14,marginTop:6,fontSize:10,color:X.mut,justifyContent:"center"}}>
              <span><span style={{display:"inline-block",width:10,height:8,background:X.acc,opacity:0.85,marginRight:6,verticalAlign:"middle"}}></span>Receita</span>
              <span><span style={{display:"inline-block",width:10,height:8,background:X.grn,marginRight:6,verticalAlign:"middle"}}></span>Lucro</span>
              <span style={{fontStyle:"italic",color:X.mut}}>Clique pra filtrar</span>
            </div>
          </div>
        </div>
      </>}
      {/* Pendências de produção — agregado claro de quanto produzir */}
      {pendProducao.length>0&&<div style={{background:"#FEE2E2",border:"2px solid #FCA5A5",borderRadius:10,padding:16,marginBottom:20}}>
        <h3 style={{margin:"0 0 10px",fontSize:14,fontWeight:700,color:X.red}}>🔴 Precisa produzir — {pendProducao.length} pedido(s) aguardando</h3>
        {/* Resumo quantitativo */}
        {(pendProducaoTotais.prod40>0||pendProducaoTotais.prod240>0||pendProducaoTotais.prod500>0)&&
          <div style={{display:"flex",gap:10,padding:"10px 12px",background:"#fff",borderRadius:8,marginBottom:10,border:"1px solid #FCA5A5"}}>
            <span style={{fontSize:11,fontWeight:700,color:X.red,paddingRight:8,borderRight:"1px solid #FCA5A5"}}>TOTAL A PRODUZIR</span>
            {pendProducaoTotais.prod40>0&&<span style={{fontSize:13,fontFamily:mo,fontWeight:700,color:"#B45309"}}>+{pendProducaoTotais.prod40}×40g</span>}
            {pendProducaoTotais.prod240>0&&<span style={{fontSize:13,fontFamily:mo,fontWeight:700,color:"#1E40AF"}}>+{pendProducaoTotais.prod240}×240g</span>}
            {pendProducaoTotais.prod500>0&&<span style={{fontSize:13,fontFamily:mo,fontWeight:700,color:"#6B21A8"}}>+{pendProducaoTotais.prod500}×500g</span>}
          </div>
        }
        {pendProducao.map(v=><div key={v.id} style={{display:"flex",alignItems:"center",gap:12,padding:"6px 0",borderBottom:"1px solid #FCA5A5"}}>
          <span style={{fontFamily:mo,fontSize:12,fontWeight:600}}>{v.id}</span>
          {v.critica&&<span style={{fontSize:10,padding:"2px 6px",borderRadius:3,background:"#B91C1C",color:"#fff",fontWeight:700,letterSpacing:.3}}>⚠️ ATRASADO</span>}
          <span style={{fontSize:13,flex:1}}>{v.comp}</span>
          <ProdChips q40={v.q40} q240={v.q240} q500={v.q500} qMel={v.qMel}/>
          <span style={{fontSize:11,fontWeight:700,color:X.red,minWidth:100,textAlign:"right"}}>
            {v.falta40Qtd>0?`−${v.falta40Qtd}×40g `:""}{v.falta240Qtd>0?`−${v.falta240Qtd}×240g `:""}{v.falta500Qtd>0?`−${v.falta500Qtd}×500g`:""}
          </span>
        </div>)}
      </div>}
      {/* Últimas 5 vendas — ordenadas por data/hora desc */}
      <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,padding:20}}>
        <h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:600}}>Últimas Vendas</h3>
        {[...vendas].sort((a,b)=>{
          const dcmp=(b.data||"").localeCompare(a.data||"");
          if(dcmp!==0)return dcmp;
          // Em caso de empate na data, usa o ID como tiebreaker (maior = mais recente)
          return (b.id||"").localeCompare(a.id||"");
        }).slice(0,5).map(v=><div key={v.id} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:`1px solid ${X.bdr}`}}>
          <span style={{fontFamily:mo,fontSize:12,color:X.mut,width:50}}>{v.id}</span>
          <span style={{fontSize:12,color:X.mut,width:60}}>{v.data?fds(v.data):""}</span>
          <span style={{fontSize:13,fontWeight:500,flex:1}}>{v.comp}</span>
          <ProdChips q40={v.q40} q240={v.q240} q500={v.q500} qMel={v.qMel}/>
          <span style={{fontFamily:mo,fontWeight:700,color:X.acc}}>{brl(v.rec)}</span>
        </div>)}
      </div>
    </>}

    {/* ══ VENDAS ══ */}
    {tab==="vendas"&&<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div><h1 style={{fontSize:22,fontWeight:700,margin:"0 0 4px"}}>Vendas e Receitas</h1><p style={{fontSize:13,color:X.mut,margin:0}}>{filtV.length} registros — Receita: {brl(stats.rec)} — Lucro: {brl(stats.luc)}</p></div>
        <div style={{display:"flex",gap:8}}>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{padding:"8px 10px",borderRadius:6,border:`1px solid ${X.bdr}`,fontSize:12,fontFamily:f,background:X.card,cursor:"pointer"}}>
            <option value="id_desc">Mais recente primeiro</option>
            <option value="id">Mais antigo primeiro</option>
            <option value="data_desc">Data ↓</option>
            <option value="data">Data ↑</option>
            <option value="comp">Cliente A→Z</option>
            <option value="rec">Receita ↓</option>
            <option value="lucro">Lucro ↓</option>
          </select>
          <input placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} style={{padding:"8px 14px",borderRadius:6,border:`1px solid ${X.bdr}`,fontSize:13,fontFamily:f,width:200,background:X.card}}/>
          <Btn primary small onClick={openNovaVenda}>+ Nova Venda</Btn>
          <Btn small onClick={()=>{const rows=filtV.map(v=>({"#":v.id,Data:fdt(v.data),Tipo:v.tipo,Cliente:v.comp,Produtos:[v.q500&&`${v.q500}x500g`,v.q240&&`${v.q240}x240g`,v.q40&&`${v.q40}x40g`,v.qMel&&`${v.qMel}xMel`].filter(Boolean).join(" + "),Frete:v.frete,Receita:v.rec,Custo:v.custo,Lucro:v.lucro,Pgto:v.met}));const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Vendas");XLSX.writeFile(wb,"kroc_vendas.xlsx")}}>📥 Excel</Btn>
        </div>
      </div>
      <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:950}}>
          <thead><tr style={{background:X.bg}}>{["#","Data","Tipo","Cliente","Produtos","Frete","Cupom","Receita","Lucro","Pgto","Entreg","Ações"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{filtV.map(v=><tr key={v.id} style={{borderBottom:`1px solid ${X.bdr}`,cursor:"pointer"}} onClick={()=>openDetalhesVenda(v)} onMouseEnter={e=>e.currentTarget.style.background=X.accL} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <td style={{...td_,fontFamily:mo,fontWeight:600,color:X.mut}}>{v.id}</td>
            <td style={{...td_,whiteSpace:"nowrap"}}>{fds(v.data)}</td>
            <td style={td_}><Badge t={v.tipo} c={v.tipo==="Amostra"?"#7C3AED":"#059669"} bg={v.tipo==="Amostra"?"#F3E8FF":"#ECFDF5"}/></td>
            <td style={{...td_,fontWeight:500,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.comp}</td>
            <td style={td_}><ProdChips q40={v.q40} q240={v.q240} q500={v.q500} qMel={v.qMel}/></td>
            <td style={{...td_,fontFamily:mo}}>{v.frete>0?brl(v.frete):""}</td>
            <td style={{...td_,fontFamily:mo,fontSize:11}}>{v.cupomCode?<span title={"-"+brl(v.descontoValor)} style={{padding:"2px 6px",borderRadius:4,background:"#FEF3C7",color:"#B45309",fontWeight:700}}>{v.cupomCode}</span>:<span style={{color:X.mut}}>—</span>}</td>
            <td style={{...td_,fontFamily:mo,fontWeight:600}}>{brl(v.rec)}</td>
            <td style={{...td_,fontFamily:mo,fontWeight:600,color:v.lucro>=0?X.grn:X.red}}>{brl(v.lucro)}</td>
            <td style={td_}><span style={{fontSize:10,padding:"2px 6px",borderRadius:4,fontWeight:600,background:v.met.includes("Pix")?"#DBEAFE":v.met.includes("Créd")?"#F3E8FF":"#FEF3E2"}}>{v.met.split(" ")[0]}</span></td>
            <td style={{...td_,textAlign:"center"}}>{v.entreg?"✅":"⏳"}</td>
            <td style={{...td_,whiteSpace:"nowrap"}} onClick={e=>e.stopPropagation()}><button onClick={()=>openEditVenda(v)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,padding:2}} title="Editar">✏️</button><button onClick={()=>deleteVenda(v.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,padding:2,marginLeft:4}} title="Excluir">🗑️</button></td>
          </tr>)}</tbody>
        </table>
      </div>
    </>}

    {/* ══ ENTREGAS ══ */}
    {tab==="entregas"&&<>
      <h1 style={{fontSize:22,fontWeight:700,margin:"0 0 20px"}}>Entregas — {stats.pend} pendente(s)</h1>
      <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:1000}}>
          <thead><tr style={{background:X.bg}}>{["#","Data","Cliente","Produtos","Endereço","Valor","Status","Ações"].map(h=><th key={h} style={{...th,...(h==="Ações"?{width:180,minWidth:180,textAlign:"center"}:{})}}>{h}</th>)}</tr></thead>
          <tbody>{vendas.filter(v=>v.comp!=="-").sort(sortFn).map(v=>{const a=ga(v.comp);const endFull=v._rua||a.rua||"";const compFull=v._comp||a.comp||"";return<tr key={v.id} style={{background:!v.entreg?"#FEF9F0":"transparent"}}>
            <td style={{...td_,fontFamily:mo,color:X.mut}}>{v.id}</td>
            <td style={{...td_,whiteSpace:"nowrap"}}>{fds(v.data)}</td>
            <td style={{...td_,fontWeight:500}}>{v.comp}</td>
            <td style={td_}><ProdChips q40={v.q40} q240={v.q240} q500={v.q500} qMel={v.qMel}/></td>
            <td style={{...td_,fontSize:11,maxWidth:220,overflow:"hidden",textOverflow:"ellipsis"}}>{endFull?`${endFull}${compFull&&compFull!=="-"?" — "+compFull:""}`:"—"}</td>
            <td style={{...td_,fontFamily:mo,fontWeight:600}}>{brl(v.rec)}</td>
            <td style={td_}>{v.entreg?<Badge t="Entregue ✅" c={X.grn} bg="#DCFCE7"/>:<Badge t="Pendente ⏳" c="#B45309" bg="#FEF3E2"/>}</td>
            <td style={{...td_,width:180,minWidth:180}}>
              {/* Grid fixo: [slot entregar] | [editar] | [excluir] — sem pular de lugar */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 32px 32px",gap:6,alignItems:"center"}}>
                <div style={{minHeight:26}}>
                  {!v.entreg?<button onClick={async()=>{
                    setVendas(p=>p.map(x=>x.id===v.id?{...x,entreg:true,prod:true}:x));
                    if(v._supaId){try{
                      await fetch(`${SUPA_URL}/rest/v1/pedidos?id=eq.${v._supaId}`,{method:"PATCH",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({entrega:"Entregue",producao:"Entregue",updated_at:new Date().toISOString()})});
                    }catch(e){console.warn("[entregar] erro:",e);}}
                    show(`${v.id} entregue. Confirmando alocação...`);
                    // Recalcula: preliminares viram confirmadas automaticamente
                    await reconciliar();
                  }} style={{width:"100%",padding:"5px 8px",borderRadius:4,border:"none",background:X.acc,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>✅ Entregar</button>:<span style={{fontSize:10,color:X.grn,fontWeight:600,textAlign:"center",display:"block"}}>✓ Entregue</span>}
                </div>
                <button onClick={()=>openEditVenda(v)} title="Editar tudo" style={{width:32,height:28,background:"#fff",border:`1px solid ${X.bdr}`,borderRadius:4,cursor:"pointer",fontSize:13}}>✏️</button>
                <button onClick={()=>deleteVenda(v.id)} title="Excluir" style={{width:32,height:28,background:"#fff",border:`1px solid ${X.bdr}`,borderRadius:4,cursor:"pointer",fontSize:13}}>🗑️</button>
              </div>
            </td>
          </tr>})}</tbody>
        </table>
      </div>
    </>}

    {/* ══ ESTOQUE ══ */}
    {tab==="estoque"&&<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <h1 style={{fontSize:22,fontWeight:700,margin:0}}>{estoqueView==="logbook"?"Logbook de Produção":estoqueView==="compras"?"Histórico de Compras":estoqueView==="mel"?"Compras de Mel":"Estoque e Produção"}</h1>
          <div style={{display:"flex",background:X.bg,borderRadius:8,padding:3,border:`1px solid ${X.bdr}`}}>
            <button onClick={()=>setEstoqueView("estoque")} style={{background:estoqueView==="estoque"?X.card:"transparent",border:"none",padding:"6px 12px",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600,color:estoqueView==="estoque"?X.txt:X.mut,boxShadow:estoqueView==="estoque"?"0 1px 3px rgba(0,0,0,0.08)":"none"}}>📦 Estoque</button>
            <button onClick={()=>setEstoqueView("logbook")} style={{background:estoqueView==="logbook"?X.card:"transparent",border:"none",padding:"6px 12px",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600,color:estoqueView==="logbook"?X.txt:X.mut,boxShadow:estoqueView==="logbook"?"0 1px 3px rgba(0,0,0,0.08)":"none"}}>📖 Logbook</button>
            <button onClick={()=>setEstoqueView("compras")} style={{background:estoqueView==="compras"?X.card:"transparent",border:"none",padding:"6px 12px",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600,color:estoqueView==="compras"?X.txt:X.mut,boxShadow:estoqueView==="compras"?"0 1px 3px rgba(0,0,0,0.08)":"none"}}>🛒 Compras</button>
            <button onClick={()=>setEstoqueView("mel")} style={{background:estoqueView==="mel"?X.card:"transparent",border:"none",padding:"6px 12px",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600,color:estoqueView==="mel"?X.txt:X.mut,boxShadow:estoqueView==="mel"?"0 1px 3px rgba(0,0,0,0.08)":"none"}}>🍯 Mel</button>
          </div>
        </div>
        {estoqueView==="estoque"&&<div style={{display:"flex",gap:8}}><Btn primary small onClick={openCompra}>+ Ingredientes</Btn><Btn primary small onClick={openLote}>+ Lote</Btn><Btn primary small onClick={openEmb}>+ Embalagens</Btn></div>}
        {estoqueView==="compras"&&<Btn primary small onClick={openCompra}>+ Nova compra</Btn>}
        {estoqueView==="mel"&&<Btn primary small onClick={openCompraMel}>+ Comprar Mel</Btn>}
      </div>

      {/* ════════════ VIEW: COMPRAS ════════════ */}
      {estoqueView==="compras"&&(()=>{
        // Agrupa compras por leva (data + fornecedor + pagador + custo_id)
        const grupos={};
        ingCompras.forEach(c=>{
          const key=`${c.data}|${c.fornecedor||"_"}|${c.pagador||"_"}|${c.custo_id||c.id}`;
          if(!grupos[key])grupos[key]={data:c.data,fornecedor:c.fornecedor,pagador:c.pagador,custo_id:c.custo_id,itens:[],total:0,kg:0};
          grupos[key].itens.push(c);
          grupos[key].total+=parseFloat(c.valor_total||c.kg*c.preco_kg||0);
          grupos[key].kg+=parseFloat(c.kg||0);
        });
        const levas=Object.values(grupos).sort((a,b)=>(b.data||"").localeCompare(a.data||""));
        const totalGeral=ingCompras.reduce((s,c)=>s+(+c.valor_total||+c.kg*+c.preco_kg||0),0);
        const kgTotal=ingCompras.reduce((s,c)=>s+(+c.kg||0),0);
        return<>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:20}}>
            <div style={{padding:"14px 16px",background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`}}>
              <p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Levas de compras</p>
              <p style={{margin:"4px 0 0",fontSize:24,fontWeight:700,fontFamily:mo}}>{levas.length}</p>
              <p style={{margin:"2px 0 0",fontSize:11,color:X.mut}}>{ingCompras.length} itens individuais</p>
            </div>
            <div style={{padding:"14px 16px",background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`}}>
              <p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Total investido</p>
              <p style={{margin:"4px 0 0",fontSize:24,fontWeight:700,fontFamily:mo,color:X.acc}}>{brl(totalGeral)}</p>
              <p style={{margin:"2px 0 0",fontSize:11,color:X.mut}}>Média {brl(levas.length>0?totalGeral/levas.length:0)}/leva</p>
            </div>
            <div style={{padding:"14px 16px",background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`}}>
              <p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Volume total</p>
              <p style={{margin:"4px 0 0",fontSize:24,fontWeight:700,fontFamily:mo,color:X.grn}}>{kgTotal.toFixed(1)}kg</p>
              <p style={{margin:"2px 0 0",fontSize:11,color:X.mut}}>Custo médio {brl(kgTotal>0?totalGeral/kgTotal:0)}/kg</p>
            </div>
            <div style={{padding:"14px 16px",background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`}}>
              <p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Última compra</p>
              <p style={{margin:"4px 0 0",fontSize:18,fontWeight:700}}>{levas[0]?fdt(levas[0].data):"—"}</p>
              <p style={{margin:"2px 0 0",fontSize:11,color:X.mut}}>{levas[0]?levas[0].fornecedor||"—":""}</p>
            </div>
          </div>

          {levas.length===0?<div style={{padding:40,textAlign:"center",background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,color:X.mut,fontSize:13}}>
            Nenhuma compra registrada ainda. Use "+ Nova compra" pra começar.
          </div>:<div style={{display:"flex",flexDirection:"column",gap:12}}>
            {levas.map((leva,idx)=>{
              const isExpanded=levaExpandida===idx;
              return<div key={idx} style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,overflow:"hidden"}}>
                {/* Header da leva — clicável pra expandir */}
                <div onClick={()=>setLevaExpandida(isExpanded?null:idx)} style={{padding:"14px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,background:isExpanded?X.bg:"transparent",borderBottom:isExpanded?`1px solid ${X.bdr}`:"none",transition:"background 0.15s"}} onMouseEnter={e=>{if(!isExpanded)e.currentTarget.style.background=X.bg}} onMouseLeave={e=>{if(!isExpanded)e.currentTarget.style.background="transparent"}}>
                  <div style={{fontSize:18,color:X.mut,transition:"transform 0.2s",transform:isExpanded?"rotate(90deg)":"rotate(0deg)"}}>▸</div>
                  <div style={{display:"grid",gridTemplateColumns:"80px 1fr auto auto auto",gap:14,flex:1,alignItems:"center"}}>
                    <div>
                      <p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Data</p>
                      <p style={{margin:"3px 0 0",fontSize:14,fontWeight:700,fontFamily:mo}}>{fdt(leva.data)}</p>
                    </div>
                    <div>
                      <p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Resumo</p>
                      <div style={{margin:"3px 0 0",display:"flex",gap:6,flexWrap:"wrap"}}>
                        {leva.itens.slice(0,3).map((i,j)=><span key={j} style={{fontSize:11,padding:"2px 8px",background:X.acc+"20",color:X.acc,borderRadius:4,fontWeight:600}}>{(+i.kg).toFixed(1)}kg {i.ingrediente_nome}</span>)}
                        {leva.itens.length>3&&<span style={{fontSize:11,padding:"2px 8px",background:X.bg,color:X.mut,borderRadius:4,fontWeight:600}}>+{leva.itens.length-3}</span>}
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Volume</p>
                      <p style={{margin:"3px 0 0",fontSize:13,fontWeight:600,fontFamily:mo,color:X.grn}}>{leva.kg.toFixed(2)}kg</p>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Total</p>
                      <p style={{margin:"3px 0 0",fontSize:15,fontWeight:800,fontFamily:mo,color:X.acc}}>{brl(leva.total)}</p>
                    </div>
                    <div style={{textAlign:"right",minWidth:90}}>
                      <p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Pagador</p>
                      <p style={{margin:"3px 0 0",fontSize:12,fontWeight:600}}>{leva.pagador||"—"}</p>
                    </div>
                  </div>
                </div>

                {/* Detalhes — só renderiza se expandida */}
                {isExpanded&&<div style={{padding:"6px 0"}}>
                  {leva.fornecedor&&<div style={{padding:"6px 18px",fontSize:11,color:X.mut,borderBottom:`1px solid ${X.bdr}`}}>
                    🏪 <strong>Fornecedor:</strong> {leva.fornecedor}
                  </div>}
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead><tr style={{background:X.bg}}>
                      <th style={{...th,paddingLeft:24}}>Ingrediente</th>
                      <th style={{...th,textAlign:"right"}}>Kg</th>
                      <th style={{...th,textAlign:"right"}}>R$/kg</th>
                      <th style={{...th,textAlign:"right"}}>Subtotal</th>
                      <th style={{...th,textAlign:"center",width:90}}>Ações</th>
                    </tr></thead>
                    <tbody>{leva.itens.map(c=><tr key={c.id} style={{borderTop:`1px solid ${X.bdr}`}}>
                      <td style={{...td_,paddingLeft:24,fontWeight:600}}>{c.ingrediente_nome}</td>
                      <td style={{...td_,textAlign:"right",fontFamily:mo}}>{(+c.kg).toFixed(2)}</td>
                      <td style={{...td_,textAlign:"right",fontFamily:mo,color:X.mut}}>{brl(c.preco_kg)}</td>
                      <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:700,color:X.acc}}>{brl(c.valor_total||c.kg*c.preco_kg)}</td>
                      <td style={{...td_,textAlign:"center"}}>
                        <div style={{display:"inline-flex",gap:4}}>
                          <button onClick={()=>openEditCompraIng(c)} title="Editar item" style={{background:"#fff",border:`1px solid ${X.bdr}`,borderRadius:4,cursor:"pointer",fontSize:12,width:26,height:24,padding:0}}>✏️</button>
                          <button onClick={()=>deleteCompraIng(c)} title="Excluir item" style={{background:"#fff",border:`1px solid ${X.bdr}`,borderRadius:4,cursor:"pointer",fontSize:12,width:26,height:24,padding:0}}>🗑️</button>
                        </div>
                      </td>
                    </tr>)}</tbody>
                  </table>
                </div>}
              </div>;
            })}
          </div>}
        </>;
      })()}

      {/* ════════════ VIEW: LOGBOOK ════════════ */}
      {/* ════════════ VIEW: MEL ════════════ */}
      {estoqueView==="mel"&&(()=>{
        const totalPotesComprados=melCompras.reduce((s,c)=>s+(+c.qtd_potes||0),0);
        const totalInvestido=melCompras.reduce((s,c)=>s+(+c.custo_total||(+c.qtd_potes*+c.custo_unit)||0),0);
        const custoMedio=totalPotesComprados>0?totalInvestido/totalPotesComprados:0;
        const potesEmEstoque=estoqueTotal.dMel||0;
        const ultimaCompra=melCompras[0];
        return<>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:20}}>
            <div style={{padding:"14px 16px",background:"#FEF9C3",borderRadius:10,border:"1px solid #CA8A0440"}}>
              <p style={{margin:0,fontSize:10,color:"#854D0E",fontWeight:700,textTransform:"uppercase"}}>Potes em estoque</p>
              <p style={{margin:"4px 0 0",fontSize:28,fontWeight:800,fontFamily:mo,color:"#CA8A04"}}>{potesEmEstoque}</p>
              <p style={{margin:"2px 0 0",fontSize:11,color:"#854D0E"}}>Disponíveis pra venda</p>
            </div>
            <div style={{padding:"14px 16px",background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`}}>
              <p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Total comprado</p>
              <p style={{margin:"4px 0 0",fontSize:24,fontWeight:700,fontFamily:mo}}>{totalPotesComprados}</p>
              <p style={{margin:"2px 0 0",fontSize:11,color:X.mut}}>{melCompras.length} compra{melCompras.length!==1?"s":""}</p>
            </div>
            <div style={{padding:"14px 16px",background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`}}>
              <p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Total investido</p>
              <p style={{margin:"4px 0 0",fontSize:22,fontWeight:700,fontFamily:mo,color:X.acc}}>{brl(totalInvestido)}</p>
              <p style={{margin:"2px 0 0",fontSize:11,color:X.mut}}>Custo médio {brl(custoMedio)}/pote</p>
            </div>
            <div style={{padding:"14px 16px",background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`}}>
              <p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Última compra</p>
              <p style={{margin:"4px 0 0",fontSize:18,fontWeight:700}}>{ultimaCompra?fdt(ultimaCompra.data):"—"}</p>
              <p style={{margin:"2px 0 0",fontSize:11,color:X.mut}}>{ultimaCompra?ultimaCompra.fornecedor||"—":""}</p>
            </div>
          </div>
          
          {melCompras.length===0?<div style={{padding:40,textAlign:"center",background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,color:X.mut,fontSize:13}}>
            <p style={{margin:"0 0 8px",fontSize:32}}>🍯</p>
            <p style={{margin:0}}>Nenhuma compra de mel registrada ainda.</p>
            <p style={{margin:"4px 0 0",fontSize:11}}>Use "+ Comprar Mel" pra registrar a primeira.</p>
          </div>:<div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,overflow:"hidden"}}>
            <div style={{padding:"14px 18px",background:"#FEF9C3",borderBottom:`1px solid ${X.bdr}`}}>
              <h3 style={{margin:0,fontSize:14,fontWeight:700,color:"#854D0E"}}>📋 Histórico de Compras de Mel</h3>
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{background:X.bg,borderBottom:`2px solid ${X.bdr}`}}>
                <th style={th}>Data</th>
                <th style={th}>Lote</th>
                <th style={{...th,textAlign:"right"}}>Potes</th>
                <th style={{...th,textAlign:"right"}}>Custo/un</th>
                <th style={{...th,textAlign:"right"}}>Total</th>
                <th style={th}>Lote Forn.</th>
                <th style={th}>Validade</th>
                <th style={th}>Pagador</th>
                <th style={{...th,textAlign:"center",width:80}}>Ações</th>
              </tr></thead>
              <tbody>{melCompras.map(c=>{
                const total=parseFloat(c.custo_total)||(parseFloat(c.qtd_potes)*parseFloat(c.custo_unit))||0;
                return<tr key={c.id} style={{borderTop:`1px solid ${X.bdr}`}} onMouseEnter={e=>e.currentTarget.style.background="#FEF9C320"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{...td_,whiteSpace:"nowrap"}}>{fds(c.data)}</td>
                  <td style={{...td_,fontFamily:mo,fontWeight:600,color:"#CA8A04"}}>{c.lote_id||"—"}</td>
                  <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:700}}>{c.qtd_potes}</td>
                  <td style={{...td_,textAlign:"right",fontFamily:mo,color:X.mut}}>{brl(c.custo_unit)}</td>
                  <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:700,color:X.acc}}>{brl(total)}</td>
                  <td style={{...td_,fontSize:11,color:X.mut}}>{c.lote_fornecedor||"—"}</td>
                  <td style={{...td_,fontSize:11,color:X.mut}}>{c.validade?fds(c.validade):"—"}</td>
                  <td style={{...td_,fontSize:11}}>{c.pagador||"Kroc"}</td>
                  <td style={{...td_,textAlign:"center"}}>
                    <div style={{display:"inline-flex",gap:4}}>
                      <button onClick={()=>openEditCompraMel(c)} title="Editar" style={{background:"#fff",border:`1px solid ${X.bdr}`,borderRadius:4,cursor:"pointer",fontSize:12,width:26,height:24,padding:0}}>✏️</button>
                      <button onClick={()=>deleteCompraMel(c)} title="Excluir" style={{background:"#fff",border:`1px solid ${X.bdr}`,borderRadius:4,cursor:"pointer",fontSize:12,width:26,height:24,padding:0}}>🗑️</button>
                    </div>
                  </td>
                </tr>;
              })}</tbody>
            </table>
          </div>}
        </>;
      })()}

      {estoqueView==="logbook"&&<>
        <p style={{fontSize:13,color:X.mut,margin:"0 0 16px"}}>
          Cada linha = uma unidade produzida. Cores identificam o lote de origem.
          {" "}<strong>{logbookUnidades.length}</strong> unidades produzidas no total •
          {" "}<strong style={{color:X.grn}}>{logbookUnidades.filter(u=>u.destino==="estoque").length}</strong> em estoque •
          {" "}<strong style={{color:X.acc}}>{logbookUnidades.filter(u=>u.destino==="venda").length}</strong> vendidas •
          {" "}<strong style={{color:"#9333EA"}}>{logbookUnidades.filter(u=>u.destino==="baixa").length}</strong> baixas
        </p>

        {/* Filtros */}
        <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,padding:16,marginBottom:16,display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:10}}>
          <div>
            <label style={{fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase",display:"block",marginBottom:4}}>Buscar</label>
            <input type="text" placeholder="pedido, cliente, lote, ID unidade (ex: 26-500-L015-007)..." value={lbBusca} onChange={e=>setLbBusca(e.target.value)} style={{width:"100%",padding:"8px 12px",fontSize:13,border:`1px solid ${X.bdr}`,borderRadius:6,fontFamily:f,boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase",display:"block",marginBottom:4}}>SKU</label>
            <select value={lbFiltroSku} onChange={e=>setLbFiltroSku(e.target.value)} style={{width:"100%",padding:"8px 10px",fontSize:12,border:`1px solid ${X.bdr}`,borderRadius:6,background:X.card,cursor:"pointer",fontFamily:f}}>
              <option value="todos">Todos</option>
              <option value="40g">40g</option>
              <option value="240g">240g</option>
              <option value="500g">500g</option>
              <option value="Mel 300g">🍯 Mel 300g</option>
            </select>
          </div>
          <div>
            <label style={{fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase",display:"block",marginBottom:4}}>Lote</label>
            <select value={lbFiltroLote} onChange={e=>setLbFiltroLote(e.target.value)} style={{width:"100%",padding:"8px 10px",fontSize:12,border:`1px solid ${X.bdr}`,borderRadius:6,background:X.card,cursor:"pointer",fontFamily:f}}>
              <option value="todos">Todos</option>
              {[...lotes].sort((a,b)=>(a.id||"").localeCompare(b.id||"")).map(l=><option key={l.id} value={l.id}>{l.id}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase",display:"block",marginBottom:4}}>Destino</label>
            <select value={lbFiltroDestino} onChange={e=>setLbFiltroDestino(e.target.value)} style={{width:"100%",padding:"8px 10px",fontSize:12,border:`1px solid ${X.bdr}`,borderRadius:6,background:X.card,cursor:"pointer",fontFamily:f}}>
              <option value="todos">Todos</option>
              <option value="estoque">Em estoque</option>
              <option value="venda">Vendidas</option>
              <option value="baixa">Baixas</option>
            </select>
          </div>
          <div>
            <label style={{fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase",display:"block",marginBottom:4}}>Ordenar</label>
            <select value={lbOrdem} onChange={e=>setLbOrdem(e.target.value)} style={{width:"100%",padding:"8px 10px",fontSize:12,border:`1px solid ${X.bdr}`,borderRadius:6,background:X.card,cursor:"pointer",fontFamily:f}}>
              <option value="recente">⬇ Mais recente (padrão)</option>
              <option value="antigo">⬆ Mais antigo</option>
              <option value="lote">🏭 Por lote</option>
              <option value="sku">📦 Por SKU</option>
              <option value="destino">📍 Por destino</option>
            </select>
          </div>
        </div>

        {/* Botões limpar filtros */}
        {(lbBusca||lbFiltroSku!=="todos"||lbFiltroLote!=="todos"||lbFiltroDestino!=="todos"||lbOrdem!=="recente")&&<div style={{marginBottom:10}}>
          <Btn small onClick={()=>{setLbBusca("");setLbFiltroSku("todos");setLbFiltroLote("todos");setLbFiltroDestino("todos");setLbOrdem("recente");}}>✖ Limpar filtros</Btn>
          <span style={{marginLeft:12,fontSize:12,color:X.mut}}>Mostrando <strong>{logbookFiltrado.length}</strong> de {logbookUnidades.length}</span>
        </div>}

        {/* Tabela de unidades */}
        {logbookFiltrado.length===0?<div style={{padding:32,textAlign:"center",background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,color:X.mut,fontSize:13}}>
          Nenhuma unidade corresponde aos filtros.
        </div>:<div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,overflow:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead style={{position:"sticky",top:0,background:X.bg,zIndex:1}}><tr>
              <th style={{...th,textAlign:"left",width:60}}>#</th>
              <th style={{...th,textAlign:"left"}}>ID Unidade</th>
              <th style={{...th,textAlign:"left"}}>Lote</th>
              <th style={{...th,textAlign:"center"}}>SKU</th>
              <th style={{...th,textAlign:"left"}}>Produzido</th>
              <th style={{...th,textAlign:"left"}}>Destino</th>
              <th style={{...th,textAlign:"left"}}>Cliente / Motivo</th>
              <th style={{...th,textAlign:"left"}}>Pedido / Baixa</th>
              <th style={{...th,textAlign:"center",width:60}}></th>
            </tr></thead>
            <tbody>{logbookFiltrado.map((u,i)=>{
              const cor=corLote[u.lote_id]||{bg:"#F3F4F6",border:"#9CA3AF"};
              const destCor=u.destino==="estoque"?X.grn:u.destino==="venda"?X.acc:"#9333EA";
              let destLabel=u.destino==="estoque"?"🟢 Em estoque":u.destino==="venda"?"🛒 Vendida":"📉 Baixa";
              // Diferencia alocação preliminar (reservada, pode mudar) vs confirmada (entregue)
              if(u.destino==="venda"&&u.statusAloc==="preliminar")destLabel="🔖 Reservada";
              else if(u.destino==="venda"&&u.statusAloc==="confirmada")destLabel="✅ Entregue";
              const shortId=u.unidadeId||"—";  // mantém pra compatibilidade interna se outro código referenciar
              return<tr key={i} style={{borderBottom:`1px solid ${X.bdr}`,background:cor.bg+"50"}}>
                <td style={{...td_,fontFamily:mo,fontWeight:700,color:X.mut}}>#{String(u.seq).padStart(4,"0")}</td>
                <td style={{...td_,fontFamily:mo,fontSize:10}}>
                  {u.unidadeId?
                    <span title={"Clique para copiar: "+u.unidadeId} onClick={()=>{navigator.clipboard.writeText(u.unidadeId);show("📋 "+u.unidadeId);}} style={{cursor:"pointer",padding:"2px 6px",borderRadius:4,background:"#1F293710",border:"1px solid #1F293720",fontWeight:700,color:X.txt}}>{u.unidadeId}</span>
                    :<span style={{color:X.mut,fontStyle:"italic"}}>gerando...</span>
                  }
                </td>
                <td style={{...td_,fontFamily:mo,fontWeight:700}}>
                  <span style={{display:"inline-block",padding:"2px 8px",borderRadius:4,background:cor.bg,border:`1px solid ${cor.border}60`,color:cor.border}}>{u.lote_id}</span>
                  <span style={{color:X.mut,fontSize:10,marginLeft:6}}>{u.lote_data?fds(u.lote_data):""}</span>
                </td>
                <td style={{...td_,textAlign:"center",fontFamily:mo,fontWeight:600}}>{u.sku}</td>
                <td style={{...td_,fontSize:11,color:X.mut}}>un #{u.unidadeNoLote}</td>
                <td style={td_}><span style={{fontSize:11,fontWeight:700,color:destCor}}>{destLabel}</span></td>
                <td style={{...td_,fontWeight:500,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis"}}>{u.cliente||"—"}</td>
                <td style={{...td_,fontFamily:mo,fontSize:11}}>
                  {u.pedido?(u.destino==="baixa"?<span style={{color:"#9333EA"}}>{u.pedido}</span>:<span>{u.pedido}</span>):"—"}
                  {u.dataDest&&<span style={{color:X.mut,marginLeft:6}}>{fds(u.dataDest)}</span>}
                </td>
                <td style={td_}>
                  {u.venda&&<button onClick={()=>openDetalhesVenda(u.venda)} style={{background:X.acc,color:"#FFF",border:"none",padding:"3px 8px",borderRadius:4,cursor:"pointer",fontSize:10,fontWeight:600}}>Ver →</button>}
                </td>
              </tr>;
            })}</tbody>
          </table>
        </div>}
      </>}

      {/* ════════════ VIEW: ESTOQUE (original) ════════════ */}
      {estoqueView==="estoque"&&<>
      {/* ESTOQUE DISPONÍVEL PARA VENDA - destaque principal */}
      <div style={{background:X.card,borderRadius:10,border:`2px solid ${(estoqueTotal.d240+estoqueTotal.d500)<=0?X.red:X.bdr}`,padding:20,marginBottom:20}}>
        <h3 style={{margin:"0 0 16px",fontSize:16,fontWeight:700}}>📦 Estoque Disponível para Venda</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16}}>
          {[["40g",estoqueTotal.d40,"#F59E0B","#FEF3C7",false],["240g",estoqueTotal.d240,"#2563EB","#DBEAFE",false],["500g",estoqueTotal.d500,"#7C3AED","#F3E8FF",false],["Mel 300g",estoqueTotal.dMel,"#CA8A04","#FEF9C3",false]].map(([tag,qtd,cor,bg,desativado])=>(
            <div key={tag} style={{padding:"20px",background:desativado?"#F3F4F6":(qtd<=0?"#FEE2E2":bg),borderRadius:12,border:`2px solid ${desativado?"#D1D5DB":(qtd<=0?X.red:cor)}40`,textAlign:"center",opacity:desativado?.55:1}}>
              <p style={{margin:0,fontSize:36,fontWeight:800,fontFamily:mo,color:desativado?"#9CA3AF":(qtd<=0?X.red:cor)}}>{qtd}</p>
              <p style={{margin:"4px 0 0",fontSize:15,fontWeight:700,color:desativado?"#6B7280":(qtd<=0?X.red:cor)}}>{tag} {desativado?"(pausado)":"disponível"}</p>
              {desativado&&<p style={{margin:"8px 0 0",fontSize:11,color:"#6B7280",fontStyle:"italic"}}>Não estamos produzindo atualmente</p>}
              {!desativado&&qtd<=0&&<p style={{margin:"8px 0 0",fontSize:13,fontWeight:700,color:X.red,background:"#FEE2E2",padding:"4px 12px",borderRadius:8,display:"inline-block"}}>🔴 PRECISA PRODUZIR</p>}
              {!desativado&&qtd>0&&qtd<=3&&<p style={{margin:"4px 0 0",fontSize:11,color:"#B45309",fontWeight:600}}>⚠️ Estoque baixo</p>}
            </div>
          ))}
        </div>
      </div>

      {/* PENDÊNCIAS: pedidos sem estoque — com resumo agregado */}
      {pendProducao.length>0&&<div style={{background:"#FEE2E2",border:"2px solid #FCA5A5",borderRadius:10,padding:16,marginBottom:20}}>
        <h3 style={{margin:"0 0 10px",fontSize:14,fontWeight:700,color:X.red}}>🔴 Precisa produzir — {pendProducao.length} pedido(s) aguardando</h3>
        {/* Resumo quantitativo */}
        {(pendProducaoTotais.prod40>0||pendProducaoTotais.prod240>0||pendProducaoTotais.prod500>0)&&
          <div style={{display:"flex",gap:16,padding:"12px 14px",background:"#fff",borderRadius:8,marginBottom:12,border:"1px solid #FCA5A5",alignItems:"center"}}>
            <span style={{fontSize:11,fontWeight:800,color:X.red,textTransform:"uppercase",letterSpacing:.5,paddingRight:12,borderRight:"1px solid #FCA5A5"}}>Total a produzir</span>
            {pendProducaoTotais.prod40>0&&<div style={{display:"inline-flex",alignItems:"baseline",gap:4}}><span style={{fontSize:22,fontFamily:mo,fontWeight:800,color:"#B45309"}}>+{pendProducaoTotais.prod40}</span><span style={{fontSize:12,color:"#B45309",fontWeight:600}}>×40g</span></div>}
            {pendProducaoTotais.prod240>0&&<div style={{display:"inline-flex",alignItems:"baseline",gap:4}}><span style={{fontSize:22,fontFamily:mo,fontWeight:800,color:"#1E40AF"}}>+{pendProducaoTotais.prod240}</span><span style={{fontSize:12,color:"#1E40AF",fontWeight:600}}>×240g</span></div>}
            {pendProducaoTotais.prod500>0&&<div style={{display:"inline-flex",alignItems:"baseline",gap:4}}><span style={{fontSize:22,fontFamily:mo,fontWeight:800,color:"#6B21A8"}}>+{pendProducaoTotais.prod500}</span><span style={{fontSize:12,color:"#6B21A8",fontWeight:600}}>×500g</span></div>}
          </div>
        }
        {pendProducao.map(v=><div key={v.id} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:"1px solid #FCA5A5",background:v.critica?"#FCA5A520":"transparent"}}>
          <span style={{fontFamily:mo,fontSize:12,fontWeight:600}}>{v.id}</span>
          {v.critica&&<span style={{fontSize:10,padding:"3px 8px",borderRadius:3,background:"#B91C1C",color:"#fff",fontWeight:700,letterSpacing:.3}}>⚠️ ATRASADO (já entregue)</span>}
          <span style={{fontSize:13,flex:1,fontWeight:v.critica?700:400}}>{v.comp}</span>
          <ProdChips q40={v.q40} q240={v.q240} q500={v.q500} qMel={v.qMel}/>
          <span style={{fontSize:11,fontWeight:700,color:X.red,background:v.critica?"#FCA5A5":"#FEE2E2",padding:"2px 8px",borderRadius:4,minWidth:130,textAlign:"right"}}>
            {[v.falta40Qtd>0&&`${v.falta40Qtd}×40g`,v.falta240Qtd>0&&`${v.falta240Qtd}×240g`,v.falta500Qtd>0&&`${v.falta500Qtd}×500g`].filter(Boolean).join(" + ")} faltando
          </span>
        </div>)}
      </div>}

      {/* LOTES DE PRODUÇÃO - com cálculo automático de disponibilidade */}
      <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,padding:20,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><h3 style={{margin:0,fontSize:15,fontWeight:700}}>🏭 Lotes de Produção</h3><Btn small onClick={openLote}>+ Novo Lote</Btn></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:14}}>
          {[...lotesCalc].reverse().map(l=>{
            const isMel=l.isMel;
            const temEstoque=isMel?l.dispMel>0:(l.disp40>0||l.disp240>0||l.disp500>0);
            const vencido=l.dias<=0;
            // Cor de tema diferente pra mel (tom dourado)
            const corBg=vencido?"#FEF2F2":temEstoque?(isMel?"#FEFCE8":"#F0FDF4"):X.bg;
            const corBorder=vencido?X.red:temEstoque?(isMel?"#CA8A04":X.grn):X.bdr;
            const validadeDias=isMel?365:45;
            return<div key={l.id} style={{padding:18,background:corBg,borderRadius:12,border:`2px solid ${corBorder}`,position:"relative"}}>
              {isMel&&<div style={{position:"absolute",top:-9,right:14,padding:"2px 10px",background:"#CA8A04",color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,letterSpacing:.5,textTransform:"uppercase"}}>🍯 Mel</div>}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontSize:18,fontWeight:800}}>{l.id}</span>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <span style={{fontSize:12,fontWeight:600,color:l.dias>30?X.grn:l.dias>7?"#B45309":l.dias>0?"#B45309":X.red,background:l.dias>30?"#DCFCE7":l.dias>0?"#FEF3C7":"#FEE2E2",padding:"3px 10px",borderRadius:20}}>
                    {vencido?"❌ Vencido":`${l.dias}d restantes`}
                  </span>
                  <button onClick={()=>{
                    if(isMel){
                      const mc=melCompras.find(c=>c.lote_id===l.id);
                      if(mc)openEditCompraMel(mc);
                      else show("⚠️ Compra de mel não encontrada pra esse lote");
                    }else{
                      openEditLote(l);
                    }
                  }} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,padding:2}} title="Editar">✏️</button>
                  <button onClick={()=>{
                    if(isMel){
                      const mc=melCompras.find(c=>c.lote_id===l.id);
                      if(mc)deleteCompraMel(mc);
                      else show("⚠️ Compra de mel não encontrada pra esse lote");
                    }else{
                      deleteLote(l.id);
                    }
                  }} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,padding:2}} title="Excluir">🗑️</button>
                </div>
              </div>
              {isMel?<p style={{margin:"0 0 12px",fontSize:12,color:X.mut}}>{l.pMel||0} potes — comprado em {fds(l.data)} → Val: {fds(new Date(parseDate(l.data).getTime()+validadeDias*864e5).toISOString())}</p>:<p style={{margin:"0 0 12px",fontSize:12,color:X.mut}}>{(l.kg||0).toFixed(2)}kg total{(l.sobra||0)>0?` (${l.sobra}kg sobra)`:""} — {fds(l.data)} → Val: {fds(new Date(parseDate(l.data).getTime()+validadeDias*864e5).toISOString())}</p>}
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr style={{background:X.bg}}>
                  <th style={{padding:"6px 8px",textAlign:"left",fontSize:10,color:X.mut,fontWeight:700}}>SKU</th>
                  <th style={{padding:"6px 8px",textAlign:"center",fontSize:10,color:X.mut}}>{isMel?"COMPRADO":"PRODUZIDO"}</th>
                  <th style={{padding:"6px 8px",textAlign:"center",fontSize:10,color:X.mut}}>VENDIDO</th>
                  <th style={{padding:"6px 8px",textAlign:"center",fontSize:10,color:X.mut,fontWeight:700}}>DISPONÍVEL</th>
                </tr></thead>
                <tbody>
                  {(isMel?[["Mel 300g",l.pMel||0,(l.ped&&l.ped.qMel)||0,l.dispMel||0]]:[["40g",l.p40||0,(l.ped&&l.ped.q40)||0,l.disp40||0],["240g",l.p240||0,(l.ped&&l.ped.q240)||0,l.disp240||0],["500g",l.p500||0,(l.ped&&l.ped.q500)||0,l.disp500||0]]).map(([s,pr,pe,dp])=>(
                    <tr key={s} style={{borderBottom:`1px solid ${X.bdr}`}}>
                      <td style={{padding:"8px",fontWeight:600}}>{s}</td>
                      <td style={{padding:"8px",textAlign:"center",color:X.mut}}>{pr}</td>
                      <td style={{padding:"8px",textAlign:"center",color:X.mut}}>{pe}</td>
                      <td style={{padding:"8px",textAlign:"center",fontWeight:800,fontSize:14,color:dp<0?X.red:dp>0?X.grn:X.mut}}>{dp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>;
          })}
        </div>
      </div>

      {/* MATÉRIA-PRIMA */}
      <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,padding:20,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><h3 style={{margin:0,fontSize:14,fontWeight:600}}>🧪 Matéria-Prima — {totalKg.toFixed(1)}kg produzidos</h3><Btn small onClick={openCompra}>+ Comprar</Btn></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>{ingEst.map(i=>{
          const low=i.est<3;
          return<div key={i.nome} onClick={()=>openDetalhesIng(i)} onMouseEnter={e=>{e.currentTarget.style.borderColor=X.acc;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=low?"#FCA5A5":X.bdr;}} style={{padding:"12px 16px",background:low?"#FEF2F2":X.bg,borderRadius:8,border:`1px solid ${low?"#FCA5A5":X.bdr}`,cursor:"pointer",transition:"border-color .15s",position:"relative"}} title="Clique para ver histórico">
            <button onClick={e=>{e.stopPropagation();openEditIng(i);}} title="Editar" style={{position:"absolute",top:8,right:8,background:"#fff",border:`1px solid ${X.bdr}`,borderRadius:4,cursor:"pointer",fontSize:11,width:24,height:22,padding:0}}>✏️</button>
            <div style={{display:"flex",justifyContent:"space-between",paddingRight:30}}>
              <span style={{fontSize:13,fontWeight:600}}>{i.nome}</span>
              {low&&<span style={{fontSize:10,color:X.red,fontWeight:700}}>⚠️ COMPRAR</span>}
            </div>
            <p style={{margin:"6px 0 2px",fontSize:20,fontWeight:700,color:low?X.red:X.txt}}>{i.est.toFixed(1)} kg</p>
            <p style={{margin:0,fontSize:11,color:X.mut}}>Comprado: {i.comprado.toFixed(1)}kg — {brl(i.precoKg)}/kg</p>
            <div style={{marginTop:6,height:4,borderRadius:2,background:"#E5E7EB"}}>
              <div style={{height:"100%",borderRadius:2,width:`${Math.min(100,Math.max(0,i.est/20*100))}%`,background:low?X.red:X.grn}}/>
            </div>
          </div>;
        })}</div>
      </div>
      {/* SKUs */}
      <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,padding:20,marginBottom:20}}>
        <h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:600}}>📦 Produtos — Custos auto-calculados</h3>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr>{["SKU","Produto","Custo Ing.","Emb.","Total","Preço","Margem"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{prodCusto.map(p=><tr key={p.sku}><td style={{...td_,fontFamily:mo,fontWeight:600}}>{p.sku}</td><td style={{...td_,fontWeight:500}}>{p.nome}</td><td style={{...td_,fontFamily:mo}}>{brl(p.custoIng)}</td><td style={{...td_,fontFamily:mo}}>{brl(p.custoEmb)}</td><td style={{...td_,fontFamily:mo,fontWeight:600}}>{brl(p.custoTotal)}</td><td style={{...td_,fontFamily:mo,color:X.acc,fontWeight:600}}>{brl(p.preco)}</td><td style={{...td_,fontFamily:mo,color:p.margem>0?X.grn:X.red,fontWeight:600}}>{p.margem.toFixed(1)}%</td></tr>)}</tbody></table>
      </div>
      {/* Embalagens — agrupadas por tamanho */}
      <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,padding:20,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><h3 style={{margin:0,fontSize:14,fontWeight:600}}>📎 Embalagens — consumo automático</h3><Btn small onClick={openEmb}>+ Comprar</Btn></div>
        {[
          {tag:"40g",cor:"#F59E0B",bg:"#FEF3C7"},
          {tag:"240g",cor:"#2563EB",bg:"#DBEAFE"},
          {tag:"500g",cor:"#7C3AED",bg:"#F3E8FF"}
        ].map(grp=>{
          const pacote=embCalc.find(e=>e.nome===`Pacote ${grp.tag}`);
          const adesivo=embCalc.find(e=>e.nome===`Adesivo ${grp.tag}`);
          if(!pacote&&!adesivo)return null;
          const disponivel=Math.min(pacote?.disp||0,adesivo?.disp||0);
          const limitante=(pacote?.disp||0)<(adesivo?.disp||0)?"Pacote":"Adesivo";
          return<div key={grp.tag} style={{marginBottom:14,padding:"14px 16px",background:grp.bg+"40",borderRadius:10,border:`2px solid ${grp.cor}30`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div>
                <span style={{fontSize:15,fontWeight:800,color:grp.cor}}>{grp.tag}</span>
                <span style={{marginLeft:10,fontSize:11,color:X.mut}}>limitado por: <strong>{limitante}</strong></span>
              </div>
              <div style={{fontSize:20,fontWeight:800,fontFamily:mo,color:disponivel<=5?X.red:grp.cor}}>
                {disponivel} <span style={{fontSize:11,fontWeight:500,color:X.mut}}>kits disponíveis</span>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[pacote,adesivo].filter(Boolean).map(e=><div key={e.nome} onClick={()=>openEditEmb(e)} style={{padding:"10px 14px",background:X.card,borderRadius:8,border:`1px solid ${X.bdr}`,cursor:"pointer"}} title="Clique para editar">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12,fontWeight:600}}>{e.nome.replace(" "+grp.tag,"")}</span>
                  <span style={{fontSize:11,color:X.mut}}>✏️</span>
                </div>
                <div style={{display:"flex",alignItems:"baseline",gap:6,marginTop:4}}>
                  <span style={{fontSize:18,fontWeight:800,fontFamily:mo,color:e.disp<=0?X.red:X.txt}}>{e.disp}</span>
                  <span style={{fontSize:10,color:X.mut}}>de {e.comprado} (usou {e.usado})</span>
                </div>
                {e.precoMedio>0&&<p style={{margin:"2px 0 0",fontSize:10,color:X.mut,fontFamily:mo}}>{brl(e.precoMedio)}/un</p>}
              </div>)}
            </div>
          </div>;
        })}
        {/* Sacola Entrega separada */}
        {embCalc.filter(e=>e.nome==="Sacola Entrega").map(e=><div key={e.nome} onClick={()=>openEditEmb(e)} style={{padding:"12px 16px",background:X.bg,borderRadius:8,border:`1px solid ${e.disp<=5?"#FCA5A5":X.bdr}`,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <span style={{fontSize:13,fontWeight:600}}>🛍️ {e.nome}</span>
            <span style={{marginLeft:10,fontSize:11,color:X.mut}}>1 por entrega Online</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:11,color:X.mut}}>Comp: {e.comprado} • Uso: {e.usado}</span>
            <span style={{fontSize:18,fontWeight:800,fontFamily:mo,color:e.disp<=0?X.red:X.txt}}>{e.disp}</span>
            {e.precoMedio>0&&<span style={{fontSize:10,color:X.mut,fontFamily:mo}}>{brl(e.precoMedio)}</span>}
            <span style={{fontSize:11,color:X.mut}}>✏️</span>
          </div>
        </div>)}
      </div>

      {/* DIAGNÓSTICO DE CONSUMO — colapsável */}
      <details style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,padding:"12px 20px",marginBottom:20}}>
        <summary style={{cursor:"pointer",fontSize:13,fontWeight:600,color:X.mut}}>🔍 Diagnóstico de consumo (auditoria)</summary>
        <div style={{padding:"16px 0 4px"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:`1px solid ${X.bdr}`}}>
              <th style={{padding:"8px 10px",textAlign:"left",fontSize:10,color:X.mut,fontWeight:700}}>SKU</th>
              <th style={{padding:"8px 10px",textAlign:"right",fontSize:10,color:X.mut,fontWeight:700}}>PRODUZIDO (LOTES)</th>
              <th style={{padding:"8px 10px",textAlign:"right",fontSize:10,color:X.mut,fontWeight:700}}>VENDIDO</th>
              <th style={{padding:"8px 10px",textAlign:"right",fontSize:10,color:X.mut,fontWeight:700}}>BAIXADO</th>
              <th style={{padding:"8px 10px",textAlign:"right",fontSize:10,color:X.mut,fontWeight:700}}>CONSUMO TOTAL</th>
              <th style={{padding:"8px 10px",textAlign:"right",fontSize:10,color:X.mut,fontWeight:700}}>EM ESTOQUE</th>
              <th style={{padding:"8px 10px",textAlign:"right",fontSize:10,color:X.mut,fontWeight:700}}>DIFERENÇA</th>
            </tr></thead>
            <tbody>
              {["40","240","500"].map(sku=>{
                const k=`q${sku}`;
                const prod=consumoDebug.produzido[k];
                const vend=consumoDebug.vendas[k];
                const baix=consumoDebug.baixas[k];
                const cons=consumoDebug.consumoTotal[k];
                const emEstoque=sku==="40"?estoqueTotal.d40:sku==="240"?estoqueTotal.d240:estoqueTotal.d500;
                // Teoricamente: produzido - consumo = estoque
                const esperado=prod-cons;
                const diff=emEstoque-esperado;
                const bate=Math.abs(diff)<1;
                return<tr key={sku} style={{borderBottom:`1px solid ${X.bdr}`,background:!bate?"#FEF3C7":"transparent"}}>
                  <td style={{padding:"8px 10px",fontWeight:700,fontFamily:mo}}>{sku}g</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontFamily:mo}}>{prod}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontFamily:mo,color:X.acc}}>−{vend}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontFamily:mo,color:"#9333EA"}}>−{baix}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontFamily:mo,fontWeight:700}}>{cons}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontFamily:mo,fontWeight:700,color:X.grn}}>{emEstoque}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontFamily:mo,fontWeight:700,color:bate?X.grn:X.red}}>{bate?"✓ OK":(diff>0?`+${diff}`:diff)}</td>
                </tr>;
              })}
            </tbody>
          </table>
          <p style={{margin:"12px 0 0",fontSize:11,color:X.mut,fontStyle:"italic"}}>💡 "Diferença" deve ser 0 (ou próximo). Se ≠ 0, algum consumo não está batendo — a coluna "em estoque" é calculada client-side via <code>lotesCalc</code>.</p>
          
          {/* Embalagens: cruza teórico vs registrado */}
          <div style={{marginTop:20,paddingTop:14,borderTop:`1px dashed ${X.bdr}`}}>
            <p style={{margin:"0 0 10px",fontSize:12,fontWeight:700,color:X.txt}}>📦 Consumo de embalagens (calculado automaticamente)</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,fontSize:11}}>
              <div style={{padding:"8px 12px",background:X.bg,borderRadius:6}}><strong>Pacote/Adesivo 40g:</strong> {consumoEmb.c40} usados</div>
              <div style={{padding:"8px 12px",background:X.bg,borderRadius:6}}><strong>Pacote/Adesivo 240g:</strong> {consumoEmb.c240} usados</div>
              <div style={{padding:"8px 12px",background:X.bg,borderRadius:6}}><strong>Pacote/Adesivo 500g:</strong> {consumoEmb.c500} usados</div>
              <div style={{padding:"8px 12px",background:X.bg,borderRadius:6}}><strong>Sacolas:</strong> {consumoEmb.sacolas} (canais: Online, WhatsApp, Feira)</div>
            </div>
            <p style={{margin:"10px 0 0",fontSize:11,color:X.mut,fontStyle:"italic"}}>⚠️ Essa contagem <strong>inclui</strong> amostras/cortesias registradas como venda, pois ainda consomem embalagem (a granola sai embalada).</p>
          </div>
        </div>
      </details>

      {/* BAIXAS — movido pra dentro de Estoque */}
      <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div>
            <h3 style={{margin:0,fontSize:14,fontWeight:600}}>📉 Baixas de Estoque</h3>
            <p style={{margin:"2px 0 0",fontSize:11,color:X.mut}}>Amostras, marketing, cortesias e perdas — desconta FIFO do lote mais antigo</p>
          </div>
          <Btn small primary onClick={openBaixa}>+ Nova Baixa</Btn>
        </div>
        {baixas.length===0?<p style={{textAlign:"center",color:X.mut,fontSize:12,padding:20,margin:0}}>Nenhuma baixa registrada</p>:<table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{background:X.bg}}>{["Data","Motivo","Categ.","Destinatário","Qtd","Custo",""].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{baixas.map(b=><tr key={b._supaId||b.id}>
            <td style={td_}>{fds(b.data)}</td>
            <td style={{...td_,fontWeight:500}}>{b.motivo}</td>
            <td style={td_}><Badge t={b.cat} c="#B45309" bg="#FEF3C7"/></td>
            <td style={{...td_,color:X.mut}}>{b.destin||"—"}</td>
            <td style={td_}><ProdChips q40={b.q40} q240={b.q240} q500={b.q500} qMel={b.qMel}/></td>
            <td style={{...td_,fontFamily:mo,color:X.red}}>{brl(b.custo)}</td>
            <td style={td_}><button onClick={()=>deleteBaixa(b)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14}}>🗑️</button></td>
          </tr>)}</tbody>
        </table>}
      </div>
      </>}
    </>}

    {/* ══ CLIENTES ══ */}
    {tab==="clientes"&&<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:14,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,margin:"0 0 4px"}}>Clientes</h1>
          <p style={{fontSize:13,color:X.mut,margin:0}}>{clientes.length} cliente{clientes.length!==1?"s":""}</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <label style={{fontSize:12,color:X.mut,fontWeight:600}}>Ordenar por:</label>
          <select value={clientesSort} onChange={e=>setClientesSort(e.target.value)} style={{padding:"6px 10px",fontSize:12,border:`1px solid ${X.bdr}`,borderRadius:6,background:X.card,fontFamily:f,cursor:"pointer"}}>
            <option value="codigo_asc">Código (C001 → ...)</option>
            <option value="codigo_desc">Código (↓)</option>
            <option value="ultimaCompra_desc">Compra mais recente</option>
            <option value="primeiraCompra_asc">Cliente mais antigo</option>
            <option value="compras_desc">Mais pedidos</option>
            <option value="total_desc">Maior receita</option>
            <option value="lucro_desc">Maior lucro</option>
            <option value="nome_asc">Nome (A → Z)</option>
            <option value="nome_desc">Nome (Z → A)</option>
          </select>
          <Btn small primary onClick={openNovoCliente}>+ Cliente</Btn>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14,marginBottom:20}}>
        {[["Total Clientes",clientes.length,"👤"],["Receita Total",brl(clientes.reduce((s,c)=>s+c.total,0)),"💰"],["Ticket Médio",brl(clientes.reduce((s,c)=>s+c.total,0)/Math.max(1,clientes.reduce((s,c)=>s+c.compras,0))),"🎯"]].map(([l,v,ic],i)=><div key={i} style={{padding:"16px 20px",background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`}}><p style={{fontSize:11,color:X.mut,margin:0}}>{l}</p><p style={{fontSize:22,fontWeight:700,margin:"6px 0 0"}}>{v}</p></div>)}
      </div>
      <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:900}}>
          <thead><tr style={{background:X.bg}}>
            {["Código","Cliente","Contato","Produtos","Pedidos","Total Gasto","Lucro","Última Compra",""].map(h=><th key={h} style={th}>{h}</th>)}
          </tr></thead>
          <tbody>{clientesOrdenados.map((c,i)=>{
            const focused=clienteFocus&&c.nome===clienteFocus;
            return(
            <tr key={c.codigo+"-"+i} onClick={()=>openDetalhesCliente(c)} onMouseEnter={e=>e.currentTarget.style.background=focused?"#FEF3C7":X.accL} onMouseLeave={e=>e.currentTarget.style.background=focused?"#FEF3C7":"transparent"} style={{background:focused?"#FEF3C7":"transparent",transition:"background 0.3s",cursor:"pointer"}}>
              <td style={{...td_,fontFamily:mo,fontWeight:700,color:c._orfao?X.mut:X.acc}}>{c.codigo}</td>
              <td style={{...td_,fontWeight:600}}>{focused&&"👉 "}{c.nome}</td>
              <td style={{...td_,fontSize:11}}>
                {c.tel&&<div style={{fontFamily:mo,color:X.txt}}>{fmtTel(c.tel)}</div>}
                {c.email&&<div style={{color:X.mut,fontSize:10}}>{c.email}</div>}
                {!c.tel&&!c.email&&"—"}
              </td>
              <td style={td_}><ProdChips q40={c.q40} q240={c.q240} q500={c.q500} qMel={c.qMel}/></td>
              <td style={{...td_,textAlign:"center",fontWeight:600}}>{c.compras}</td>
              <td style={{...td_,fontFamily:mo,fontWeight:700,color:X.acc}}>{brl(c.total)}</td>
              <td style={{...td_,fontFamily:mo,fontWeight:600,color:c.lucro>=0?X.grn:X.red}}>{brl(c.lucro)}</td>
              <td style={{...td_,fontSize:11,whiteSpace:"nowrap",color:X.mut}}>{c.ultimaCompra?fds(c.ultimaCompra):"—"}</td>
              <td style={{...td_,textAlign:"right"}} onClick={e=>e.stopPropagation()}>
                <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                  <button onClick={()=>openEditCliente(c)} title="Editar" style={{background:"#fff",border:`1px solid ${X.bdr}`,borderRadius:4,cursor:"pointer",fontSize:13,width:28,height:26}}>✏️</button>
                  {c._supaId&&<button onClick={()=>deleteCliente(c)} title="Excluir" style={{background:"#fff",border:`1px solid ${X.bdr}`,borderRadius:4,cursor:"pointer",fontSize:13,width:28,height:26}}>🗑️</button>}
                </div>
              </td>
            </tr>
            );
          })}</tbody>
        </table>
      </div>
      <p style={{margin:"8px 0 0",fontSize:10,color:X.mut,fontStyle:"italic"}}>💡 Clique na linha pra ver detalhes • ✏️ pra editar • 🗑️ pra excluir</p>
    </>}

    {/* ══ CUSTOS ══ */}
    {tab==="custos"&&<>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,margin:0}}>Custos e Despesas</h1>
          <p style={{fontSize:13,color:X.mut,margin:"4px 0 0"}}>Fixos recorrentes são calculados mensalmente • Variáveis só contam uma vez</p>
        </div>
        <Btn primary small onClick={openCusto}>+ Nova Despesa</Btn>
      </div>

      {/* ─── Custos FIXOS RECORRENTES (únicos registros, mas somam X/mês) ─── */}
      {(()=>{
        const fixos=custos.filter(c=>c.recorrente);
        const totalMes=fixos.reduce((s,c)=>s+c.valor,0);
        return<div style={{background:"#FEF3C7",borderRadius:10,border:"2px solid #F59E0B",padding:20,marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <h3 style={{margin:0,fontSize:14,fontWeight:700,color:"#B45309"}}>🔁 Custos Fixos Recorrentes — {brl(totalMes)}/mês</h3>
            <span style={{fontSize:11,color:"#B45309"}}>{fixos.length} itens</span>
          </div>
          {fixos.length===0?<p style={{margin:0,fontSize:12,color:X.mut}}>Nenhum custo fixo recorrente. Marque um custo como "Recorrente" ao criar.</p>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:10}}>{fixos.map(c=><div key={c._supaId||c.id} onClick={()=>openDetalhesCusto(c)} onMouseEnter={e=>{e.currentTarget.style.borderColor=X.acc;e.currentTarget.style.boxShadow="0 2px 6px rgba(200,118,45,0.15)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=X.bdr;e.currentTarget.style.boxShadow="none";}} style={{padding:"10px 14px",background:X.card,borderRadius:8,border:`1px solid ${X.bdr}`,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",transition:"border-color .15s, box-shadow .15s"}} title="Clique para ver detalhes">
            <div style={{minWidth:0,flex:1}}>
              <p style={{margin:0,fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.desp}</p>
              <p style={{margin:"2px 0 0",fontSize:10,color:X.mut}}>{c.forn||"—"} • {c.pag}</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6}} onClick={e=>e.stopPropagation()}>
              <span style={{fontFamily:mo,color:X.acc,fontWeight:700,fontSize:13}}>{brl(c.valor)}</span>
              <button onClick={()=>openEditCusto(c)} title="Editar" style={{background:"#fff",border:`1px solid ${X.bdr}`,borderRadius:4,cursor:"pointer",fontSize:12,width:26,height:24}}>✏️</button>
              <button onClick={()=>deleteCusto(c)} title="Excluir" style={{background:"#fff",border:`1px solid ${X.bdr}`,borderRadius:4,cursor:"pointer",fontSize:12,width:26,height:24}}>🗑️</button>
            </div>
          </div>)}</div>}
        </div>;
      })()}

      {/* ─── Despesas variáveis por mês (dinâmico, mais recente em cima) ─── */}
      {(()=>{
        // Gera lista de meses a partir dos custos + mês atual
        const mesesSet=new Set();
        custos.filter(c=>!c.recorrente&&c.mes).forEach(c=>mesesSet.add(c.mes));
        mesesSet.add(mesAbrev(today()));
        // Ordenação: mais recente primeiro. Uso a data do primeiro custo de cada mês como proxy.
        const mesesInfo=Array.from(mesesSet).map(m=>{
          const item=custos.filter(c=>c.mes===m).sort((a,b)=>(b.data||"").localeCompare(a.data||""))[0];
          return {mes:m,refData:item?.data||today()};
        });
        mesesInfo.sort((a,b)=>(b.refData||"").localeCompare(a.refData||""));
        return mesesInfo.map(({mes})=>{
          const items=custos.filter(c=>c.mes===mes&&!c.recorrente).sort((a,b)=>(b.data||"").localeCompare(a.data||""));
          const tot=items.reduce((s,c)=>s+c.valor,0);
          const fixosTot=custos.filter(c=>c.recorrente).reduce((s,c)=>s+c.valor,0);
          const anoMes=items[0]?.data?.slice(0,4)||new Date().getFullYear();
          return<div key={mes} style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,padding:20,marginBottom:20}}>
            <h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:600}}>📅 {mes} {anoMes} — {brl(tot)} variáveis + {brl(fixosTot)} fixos = {brl(tot+fixosTot)} total</h3>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr>{["Data","Despesa","Desc","Fornecedor","Categ.","Valor","Pagador","Reemb Pend.",""].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{items.length===0?<tr><td colSpan={9} style={{padding:20,textAlign:"center",color:X.mut}}>Sem despesas variáveis em {mes}</td></tr>:items.map(c=>{
                const pags=custoPagamentos.filter(p=>p.custoId===c._supaId);
                const totReemb=pags.reduce((s,p)=>s+(p.reembPendente||0),0);
                const nPag=pags.length;
                const pagLabel=nPag===0?(c.pag||"—"):nPag===1?pags[0].pagador:`${nPag} pessoas`;
                return<tr key={c._supaId||c.id} style={{cursor:"pointer",transition:"background .15s"}} onClick={()=>openDetalhesCusto(c)} onMouseEnter={e=>e.currentTarget.style.background=X.accL} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={td_}>{fds(c.data)}</td>
                  <td style={{...td_,fontWeight:500}}>{c.desp}</td>
                  <td style={{...td_,color:X.mut,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis"}}>{c.desc}</td>
                  <td style={{...td_,color:X.mut}}>{c.forn}</td>
                  <td style={td_}><Badge t={c.cat} c="#059669" bg="#ECFDF5"/></td>
                  <td style={{...td_,fontFamily:mo,fontWeight:600}}>{brl(c.valor)}</td>
                  <td style={{...td_,fontSize:11}} title={nPag>1?pags.map(p=>`${p.pagador}: ${brl(p.valorPago)}`).join("\n"):""}>{pagLabel}</td>
                  <td style={{...td_,fontFamily:mo,fontSize:11,color:totReemb>0?X.red:X.mut,fontWeight:totReemb>0?600:400}}>{totReemb>0?brl(totReemb):"—"}</td>
                  <td style={td_} onClick={e=>e.stopPropagation()}>
                    <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                      <button onClick={()=>openEditCusto(c)} title="Editar" style={{background:"#fff",border:`1px solid ${X.bdr}`,borderRadius:4,cursor:"pointer",fontSize:13,width:28,height:26}}>✏️</button>
                      <button onClick={()=>deleteCusto(c)} title="Excluir" style={{background:"#fff",border:`1px solid ${X.bdr}`,borderRadius:4,cursor:"pointer",fontSize:13,width:28,height:26}}>🗑️</button>
                    </div>
                  </td>
                </tr>;
              })}</tbody>
            </table>
            <p style={{margin:"8px 0 0",fontSize:10,color:X.mut,fontStyle:"italic"}}>💡 Clique na linha pra ver detalhes • ✏️ pra editar • 🗑️ pra excluir</p>
          </div>;
        });
      })()}

      {/* ─── Reembolsos por pessoa com marcar como pago ─── */}
      <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,padding:20}}>
        <h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:600}}>💸 Reembolsos</h3>
        {reembPorPagador.length===0?<p style={{margin:0,fontSize:12,color:X.mut}}>Nenhuma despesa com pagamento de sócio registrada.</p>:
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:14}}>
            {reembPorPagador.map(r=>{
              const hasPend=r.totalPend>0;
              const hasQuit=r.totalQuit>0;
              return<div key={r.pagador} style={{padding:"14px 16px",background:hasPend?"#FEF2F2":"#ECFDF5",borderRadius:8,border:`1px solid ${hasPend?"#FECACA":"#A7F3D0"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div>
                    <p style={{margin:0,fontSize:14,fontWeight:700}}>{r.pagador}</p>
                    <p style={{margin:"2px 0 0",fontSize:11,color:X.mut}}>
                      {hasPend?<span>{r.pendentes.length} pendência(s)</span>:null}
                      {hasPend&&hasQuit?" • ":""}
                      {hasQuit?<span>{r.quitados.length} quitado(s)</span>:null}
                    </p>
                  </div>
                  <div style={{textAlign:"right"}}>
                    {hasPend&&<p style={{margin:0,fontSize:20,fontWeight:800,fontFamily:mo,color:X.red}}>{brl(r.totalPend)}</p>}
                    {!hasPend&&<p style={{margin:0,fontSize:16,fontWeight:700,fontFamily:mo,color:X.grn}}>✓ Zerado</p>}
                    {hasQuit&&<p style={{margin:"2px 0 0",fontSize:10,color:X.grn,fontFamily:mo}}>Já quitado: {brl(r.totalQuit)}</p>}
                  </div>
                </div>
                
                {/* Lista de pendências */}
                {hasPend&&<div style={{background:"#fff",borderRadius:6,overflow:"hidden",marginTop:10}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <tbody>
                      {r.pendentes.map(p=><tr key={p.cpId} style={{borderBottom:`1px solid ${X.bdr}`}}>
                        <td style={{padding:"8px 10px",fontSize:11}}>{fds(p.data)}</td>
                        <td style={{padding:"8px 10px",fontWeight:500}}>{p.desp}</td>
                        <td style={{padding:"8px 10px",fontFamily:mo,textAlign:"right",fontWeight:700,color:X.red}}>{brl(p.pendente)}</td>
                        <td style={{padding:"8px 10px",textAlign:"right"}}><button onClick={()=>marcarReembolsoPago(p.cpId,p.pendente)} style={{padding:"4px 10px",borderRadius:4,border:"none",background:X.grn,color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer"}}>✅ Marcar como pago</button></td>
                      </tr>)}
                    </tbody>
                  </table>
                </div>}
                
                {/* Lista de quitados (colapsável) */}
                {hasQuit&&<details style={{marginTop:10}}>
                  <summary style={{cursor:"pointer",fontSize:11,color:X.mut,padding:"4px 0"}}>▸ Ver histórico quitado ({r.quitados.length})</summary>
                  <div style={{background:"#fff",borderRadius:6,overflow:"hidden",marginTop:6,opacity:.8}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                      <tbody>
                        {r.quitados.map(p=><tr key={p.cpId} style={{borderBottom:`1px solid ${X.bdr}`}}>
                          <td style={{padding:"6px 10px",fontSize:11}}>{p.quitadoEm?fds(p.quitadoEm.split("T")[0]):fds(p.data)}</td>
                          <td style={{padding:"6px 10px",fontWeight:500}}>{p.desp}</td>
                          <td style={{padding:"6px 10px",fontFamily:mo,textAlign:"right",fontWeight:600,color:X.grn}}>✓ {brl(p.quitado)}</td>
                          <td style={{padding:"6px 10px",textAlign:"right"}}><button onClick={()=>desmarcarReembolsoPago(p.cpId,p.quitado)} style={{padding:"4px 8px",borderRadius:4,border:`1px solid ${X.bdr}`,background:"#fff",fontSize:10,color:X.mut,cursor:"pointer"}}>↩️ Reverter</button></td>
                        </tr>)}
                      </tbody>
                    </table>
                  </div>
                </details>}
              </div>;
            })}
          </div>
        }
      </div>
    </>}

    {/* ══ DEMONSTRATIVOS FINANCEIROS ══ */}
    {tab==="dfs"&&<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,margin:"0 0 4px"}}>Demonstrativos Financeiros — 2026</h1>
          <p style={{fontSize:13,color:X.mut,margin:0}}>Calculado automaticamente a partir das vendas e custos registrados</p>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Btn small onClick={exportFluxoCSV}>⬇️ Fluxo de Caixa</Btn>
          <Btn small onClick={exportDreCSV}>⬇️ DRE</Btn>
          <Btn small onClick={exportBalancoCSV}>⬇️ Balanço</Btn>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:14,marginBottom:24}}>
        {[["Receita Total",brl(dfs.tot.totalEntradas),"💰"],["Total Saídas",brl(dfs.tot.totalSaidas),"📤"],["Fluxo Operacional",brl(dfs.tot.fluxoOp),"📊"],["Saldo Acumulado",brl(dfs.tot.saldoFinal),"🏦"],["Margem Bruta",(dfs.tot.margem*100).toFixed(1)+"%","📈"],["Pacotes Vendidos",dfs.tot.pacs,"📦"]].map(([l,v,ic],i)=>(
          <div key={i} style={{padding:"16px 20px",background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`}}>
            <p style={{fontSize:11,color:X.mut,margin:0}}>{l}</p>
            <p style={{fontSize:20,fontWeight:700,margin:"6px 0 0",color:typeof v==="string"&&v.includes("-")?X.red:X.txt}}>{v}</p>
          </div>
        ))}
      </div>

      {/* FLUXO DE CAIXA */}
      <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,overflow:"auto",marginBottom:24}}>
        <div style={{padding:"16px 20px",borderBottom:`2px solid ${X.bdr}`}}><h3 style={{margin:0,fontSize:15,fontWeight:700}}>💰 Fluxo de Caixa Mensal</h3></div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:900}}>
          <thead><tr style={{background:X.bg}}>
            <th style={{...th,position:"sticky",left:0,background:X.bg,zIndex:1,minWidth:180}}></th>
            {dfs.data.map(d=><th key={d.m} style={{...th,textAlign:"right",minWidth:90}}>{d.m}</th>)}
            <th style={{...th,textAlign:"right",minWidth:100,fontWeight:800}}>TOTAL</th>
          </tr></thead>
          <tbody>
            {/* ENTRADAS */}
            <tr style={{background:"#F0FDF4"}}><td colSpan={12} style={{padding:"8px 12px",fontWeight:700,fontSize:12,color:X.grn}}>📥 ENTRADAS</td></tr>
            {[["Receita de Vendas","receita"],["Receita Amostras","recAmostras"]].map(([label,key])=>(
              <tr key={key}><td style={{...td_,paddingLeft:24,color:X.mut}}>{label}</td>
              {dfs.data.map(d=><td key={d.m} style={{...td_,textAlign:"right",fontFamily:mo}}>{brl(d[key])}</td>)}
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:600}}>{brl(dfs.tot[key])}</td></tr>
            ))}
            <tr style={{background:"#DCFCE7"}}><td style={{...td_,fontWeight:700,color:X.grn}}>(=) Total Entradas</td>
            {dfs.data.map(d=><td key={d.m} style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:700,color:X.grn}}>{brl(d.totalEntradas)}</td>)}
            <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:800,color:X.grn}}>{brl(dfs.tot.totalEntradas)}</td></tr>

            {/* SAÍDAS */}
            <tr style={{background:"#FEF2F2"}}><td colSpan={12} style={{padding:"8px 12px",fontWeight:700,fontSize:12,color:X.red}}>📤 SAÍDAS</td></tr>
            {[["Matéria-Prima","catMP"],["Embalagens","catEmb"],["Revenda (Mel)","catRev"],["Frete","catFrete"],["Feira/Eventos","catFeira"],["Marketing","catMkt"],["Outros","catOutros"]].map(([label,key])=>(
              <tr key={key}><td style={{...td_,paddingLeft:24,color:X.mut}}>{label}</td>
              {dfs.data.map(d=><td key={d.m} style={{...td_,textAlign:"right",fontFamily:mo}}>{d[key]>0?brl(d[key]):"—"}</td>)}
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:600}}>{dfs.tot[key]>0?brl(dfs.tot[key]):"—"}</td></tr>
            ))}
            <tr><td style={{...td_,paddingLeft:24,color:X.mut}}>Custos Fixos</td>
            {dfs.data.map(d=><td key={d.m} style={{...td_,textAlign:"right",fontFamily:mo}}>{d.custosFixosMesReal>0?brl(d.custosFixosMesReal):"—"}</td>)}
            <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:600}}>{brl(dfs.tot.custosFixosMesReal)}</td></tr>
            <tr style={{background:"#FEE2E2"}}><td style={{...td_,fontWeight:700,color:X.red}}>(=) Total Saídas</td>
            {dfs.data.map(d=><td key={d.m} style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:700,color:X.red}}>{brl(d.totalSaidas)}</td>)}
            <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:800,color:X.red}}>{brl(dfs.tot.totalSaidas)}</td></tr>

            {/* FLUXO OPERACIONAL = FLUXO LÍQUIDO (sem double-counting de reembolso) */}
            <tr style={{height:8}}><td colSpan={12}></td></tr>
            <tr style={{background:"#DBEAFE"}}><td style={{...td_,fontWeight:800,fontSize:12,color:X.blu}}>🏦 FLUXO LÍQUIDO</td>
            {dfs.data.map(d=><td key={d.m} style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:800,color:d.fluxoLiq>=0?X.grn:X.red}}>{brl(d.fluxoLiq)}</td>)}
            <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:800,fontSize:13,color:dfs.tot.fluxoLiq>=0?X.grn:X.red}}>{brl(dfs.tot.fluxoLiq)}</td></tr>

            {/* INFO: Reembolsos quitados no mês (informativo — não afeta saldo, já está em Saídas) */}
            <tr style={{height:4}}><td colSpan={12}></td></tr>
            <tr><td style={{...td_,color:X.mut,fontStyle:"italic",fontSize:11}} title="Dinheiro que saiu da Kroc para sócios neste mês. Não é subtraído do saldo porque o custo já está nas Saídas.">💸 Reemb. quitados (info)</td>
            {dfs.data.map(d=><td key={d.m} style={{...td_,textAlign:"right",fontFamily:mo,color:X.mut,fontStyle:"italic",fontSize:11}}>{d.reembQuitadoMes>0?brl(d.reembQuitadoMes):"—"}</td>)}
            <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:600,fontStyle:"italic",fontSize:11,color:X.mut}}>{dfs.tot.reembQuitadoMes>0?brl(dfs.tot.reembQuitadoMes):"—"}</td></tr>
            <tr><td style={{...td_,color:X.mut,fontStyle:"italic",fontSize:11}} title="Total atual que a Kroc ainda deve aos sócios em reembolso.">⏳ Reemb. pendente (atual)</td>
            {dfs.data.map(d=><td key={d.m} style={{...td_,textAlign:"right",fontFamily:mo,color:X.mut,fontSize:11}}>—</td>)}
            <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:600,fontSize:11,color:dfs.tot.reembPendenteTotal>0?X.red:X.mut}}>{dfs.tot.reembPendenteTotal>0?brl(dfs.tot.reembPendenteTotal):"R$ 0"}</td></tr>

            {/* SALDO */}
            <tr style={{height:4}}><td colSpan={12}></td></tr>
            <tr><td style={{...td_,color:X.mut,fontSize:10}}>Saldo Inicial</td>
            {dfs.data.map(d=><td key={d.m} style={{...td_,textAlign:"right",fontFamily:mo,fontSize:10,color:X.mut}}>{brl(d.saldoInicial)}</td>)}
            <td style={{...td_,textAlign:"right"}}></td></tr>
            <tr style={{background:X.bg,borderTop:`2px solid ${X.bdr}`}}><td style={{...td_,fontWeight:800,fontSize:12}}>SALDO ACUMULADO</td>
            {dfs.data.map(d=><td key={d.m} style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:800,fontSize:12,color:d.saldoFinal>=0?X.grn:X.red}}>{brl(d.saldoFinal)}</td>)}
            <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:800,fontSize:13,color:dfs.tot.saldoFinal>=0?X.grn:X.red}}>{brl(dfs.tot.saldoFinal)}</td></tr>
          </tbody>
        </table>
      </div>

      {/* INDICADORES */}
      <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,overflow:"auto"}}>
        <div style={{padding:"16px 20px",borderBottom:`2px solid ${X.bdr}`}}><h3 style={{margin:0,fontSize:15,fontWeight:700}}>📊 Indicadores Mensais</h3></div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:900}}>
          <thead><tr style={{background:X.bg}}>
            <th style={{...th,position:"sticky",left:0,background:X.bg,minWidth:180}}></th>
            {dfs.data.map(d=><th key={d.m} style={{...th,textAlign:"right",minWidth:90}}>{d.m}</th>)}
            <th style={{...th,textAlign:"right",minWidth:100,fontWeight:800}}>TOTAL</th>
          </tr></thead>
          <tbody>
            <tr><td style={{...td_,fontWeight:500}}>Nº Pedidos</td>
            {dfs.data.map(d=><td key={d.m} style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:600}}>{d.nPedidos||"—"}</td>)}
            <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:700}}>{dfs.tot.nPedidos}</td></tr>

            <tr><td style={{...td_,fontWeight:500}}>Ticket Médio</td>
            {dfs.data.map(d=><td key={d.m} style={{...td_,textAlign:"right",fontFamily:mo}}>{d.ticket>0?brl(d.ticket):"—"}</td>)}
            <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:600}}>{dfs.tot.ticket>0?brl(dfs.tot.ticket):"—"}</td></tr>

            <tr><td style={{...td_,fontWeight:500}}>Pacotes Vendidos</td>
            {dfs.data.map(d=><td key={d.m} style={{...td_,textAlign:"right",fontFamily:mo}}>{d.pacs||"—"}</td>)}
            <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:700}}>{dfs.tot.pacs}</td></tr>

            <tr><td style={{...td_,fontWeight:500}}>Margem Bruta</td>
            {dfs.data.map(d=><td key={d.m} style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:600,color:d.margem>0?X.grn:d.margem<0?X.red:X.mut}}>{d.totalEntradas>0?(d.margem*100).toFixed(1)+"%":"—"}</td>)}
            <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:700,color:dfs.tot.margem>=0?X.grn:X.red}}>{(dfs.tot.margem*100).toFixed(1)}%</td></tr>
          </tbody>
        </table>
      </div>

      {/* ═══ DRE — DEMONSTRAÇÃO DO RESULTADO ═══ */}
      <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,overflow:"hidden",marginTop:24,marginBottom:24}}>
        <div style={{padding:"16px 20px",borderBottom:`2px solid ${X.bdr}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h3 style={{margin:0,fontSize:15,fontWeight:700}}>🧾 DRE — Demonstração do Resultado do Exercício</h3>
            <p style={{margin:"4px 0 0",fontSize:11,color:X.mut}}>2026 (acumulado)</p>
          </div>
          <Btn small onClick={exportDreCSV}>⬇️ CSV</Btn>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <tbody>
            <tr style={{background:"#F0FDF4"}}>
              <td style={{...td_,fontWeight:700,color:X.grn}}>RECEITA BRUTA</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:700,color:X.grn}}>{brl(dre.receitaBruta)}</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11,color:X.mut,width:80}}>100,0%</td>
            </tr>
            <tr><td style={{...td_,paddingLeft:24,color:X.mut}}>(-) Deduções (impostos retidos)</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo}}>{brl(-dre.deducoes)}</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11,color:X.mut}}>—</td></tr>
            <tr style={{background:"#DCFCE7"}}>
              <td style={{...td_,fontWeight:700,color:X.grn}}>(=) RECEITA OPERACIONAL LÍQUIDA</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:700,color:X.grn}}>{brl(dre.rol)}</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11,color:X.grn,fontWeight:600}}>100,0%</td>
            </tr>
            <tr style={{height:6}}><td colSpan={3}></td></tr>
            <tr style={{background:"#FEF2F2"}}>
              <td style={{...td_,fontWeight:600,color:X.red}}>(-) CUSTO DA MERCADORIA VENDIDA (CMV)</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:600,color:X.red}}>{brl(-dre.cmv)}</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11,color:X.mut}}>{dre.rol>0?(dre.cmv/dre.rol*100).toFixed(1):"0"}%</td>
            </tr>
            <tr><td style={{...td_,paddingLeft:32,color:X.mut,fontSize:11}}>Matéria-Prima</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11}}>{brl(-dre.cmvMP)}</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:10,color:X.mut}}>{dre.rol>0?(dre.cmvMP/dre.rol*100).toFixed(1):"0"}%</td></tr>
            <tr><td style={{...td_,paddingLeft:32,color:X.mut,fontSize:11}}>Embalagens</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11}}>{brl(-dre.cmvEmb)}</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:10,color:X.mut}}>{dre.rol>0?(dre.cmvEmb/dre.rol*100).toFixed(1):"0"}%</td></tr>
            <tr><td style={{...td_,paddingLeft:32,color:X.mut,fontSize:11}}>🍯 Revenda (Mel)</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11}}>{brl(-(dre.cmvRev||0))}</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:10,color:X.mut}}>{dre.rol>0?((dre.cmvRev||0)/dre.rol*100).toFixed(1):"0"}%</td></tr>
            <tr style={{background:"#DBEAFE"}}>
              <td style={{...td_,fontWeight:700,color:X.blu}}>(=) LUCRO BRUTO</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:700,color:dre.lucroBruto>=0?X.blu:X.red}}>{brl(dre.lucroBruto)}</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11,fontWeight:700,color:dre.margemBruta>=0?X.blu:X.red}}>{(dre.margemBruta*100).toFixed(1)}%</td>
            </tr>
            <tr style={{height:6}}><td colSpan={3}></td></tr>
            <tr style={{background:"#FEF2F2"}}>
              <td style={{...td_,fontWeight:600,color:X.red}}>(-) DESPESAS OPERACIONAIS</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:600,color:X.red}}>{brl(-dre.totalDespesas)}</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11,color:X.mut}}>{dre.rol>0?(dre.totalDespesas/dre.rol*100).toFixed(1):"0"}%</td>
            </tr>
            <tr><td style={{...td_,paddingLeft:32,color:X.mut,fontSize:11}}>Frete</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11}}>{brl(-dre.despFrete)}</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:10,color:X.mut}}>—</td></tr>
            <tr><td style={{...td_,paddingLeft:32,color:X.mut,fontSize:11}}>Feira/Eventos</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11}}>{brl(-dre.despFeira)}</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:10,color:X.mut}}>—</td></tr>
            <tr><td style={{...td_,paddingLeft:32,color:X.mut,fontSize:11}}>Marketing</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11}}>{brl(-dre.despMkt)}</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:10,color:X.mut}}>—</td></tr>
            <tr><td style={{...td_,paddingLeft:32,color:X.mut,fontSize:11}}>Custos Fixos</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11}}>{brl(-dre.despFixos)}</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:10,color:X.mut}}>—</td></tr>
            <tr><td style={{...td_,paddingLeft:32,color:X.mut,fontSize:11}}>Outros</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11}}>{brl(-dre.despOutros)}</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:10,color:X.mut}}>—</td></tr>
            <tr style={{background:"#DBEAFE"}}>
              <td style={{...td_,fontWeight:700,color:X.blu}}>(=) EBITDA / Lucro Operacional</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:700,color:dre.ebitda>=0?X.blu:X.red}}>{brl(dre.ebitda)}</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11,fontWeight:700,color:dre.margemEbitda>=0?X.blu:X.red}}>{(dre.margemEbitda*100).toFixed(1)}%</td>
            </tr>
            <tr style={{height:6}}><td colSpan={3}></td></tr>
            <tr style={{background:dre.lucroLiquido>=0?"#DCFCE7":"#FEE2E2",borderTop:`2px solid ${X.bdr}`}}>
              <td style={{...td_,fontWeight:800,fontSize:13,color:dre.lucroLiquido>=0?X.grn:X.red}}>(=) LUCRO LÍQUIDO DO EXERCÍCIO</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:800,fontSize:14,color:dre.lucroLiquido>=0?X.grn:X.red}}>{brl(dre.lucroLiquido)}</td>
              <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:800,fontSize:12,color:dre.margemLiquida>=0?X.grn:X.red}}>{(dre.margemLiquida*100).toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
        <div style={{padding:"10px 16px",background:"#FEF3C7",borderTop:`1px solid ${X.bdr}`,fontSize:11,color:"#B45309"}}>
          ℹ️ DRE simplificada — não inclui depreciação, amortização nem provisão de impostos (regime Simples Nacional)
        </div>
      </div>

      {/* ═══ BALANÇO PATRIMONIAL ═══ */}
      <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,overflow:"hidden",marginBottom:24}}>
        <div style={{padding:"16px 20px",borderBottom:`2px solid ${X.bdr}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h3 style={{margin:0,fontSize:15,fontWeight:700}}>📊 Balanço Patrimonial</h3>
            <p style={{margin:"4px 0 0",fontSize:11,color:X.mut}}>Snapshot de {fds(today())}</p>
          </div>
          <Btn small onClick={exportBalancoCSV}>⬇️ CSV</Btn>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
          {/* ATIVO */}
          <div style={{borderRight:`1px solid ${X.bdr}`}}>
            <div style={{padding:"10px 16px",background:"#DBEAFE",borderBottom:`1px solid ${X.bdr}`}}>
              <p style={{margin:0,fontWeight:700,fontSize:12,color:X.blu,letterSpacing:.5}}>ATIVO</p>
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <tbody>
                <tr><td style={{...td_,fontWeight:700,fontSize:11,color:X.txt,paddingTop:10}}>ATIVO CIRCULANTE</td>
                  <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:700,paddingTop:10}}>{brl(balanco.ativoCirculante)}</td></tr>
                <tr><td style={{...td_,paddingLeft:24,color:X.mut,fontSize:11}}>💰 Caixa e Equivalentes</td>
                  <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11}}>{brl(balanco.caixa)}</td></tr>
                <tr><td style={{...td_,paddingLeft:24,color:X.mut,fontSize:11}}>🌾 Estoque - Matéria-Prima</td>
                  <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11}}>{brl(balanco.estoqueMP)}</td></tr>
                <tr><td style={{...td_,paddingLeft:24,color:X.mut,fontSize:11}}>📦 Estoque - Produtos Acabados</td>
                  <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11}}>{brl(balanco.estoquePA)}</td></tr>
                <tr><td style={{...td_,paddingLeft:32,color:X.mut,fontSize:10}}>{balanco.stockBySku["40"]}× 40g + {balanco.stockBySku["240"]}× 240g + {balanco.stockBySku["500"]}× 500g</td>
                  <td style={{...td_}}></td></tr>
                <tr><td style={{...td_,paddingLeft:24,color:X.mut,fontSize:11}}>📋 Contas a Receber</td>
                  <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11}}>{brl(balanco.contasReceber)}</td></tr>
                <tr style={{height:6}}><td colSpan={2}></td></tr>
                <tr><td style={{...td_,fontWeight:700,fontSize:11}}>ATIVO NÃO-CIRCULANTE</td>
                  <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:700}}>{brl(balanco.ativoNaoCirculante)}</td></tr>
                <tr><td style={{...td_,paddingLeft:24,color:X.mut,fontSize:10,fontStyle:"italic"}}>(sem ativos imobilizados rastreados)</td>
                  <td style={{...td_}}></td></tr>
                <tr style={{background:"#DBEAFE",borderTop:`2px solid ${X.bdr}`}}>
                  <td style={{...td_,fontWeight:800,fontSize:13,color:X.blu}}>TOTAL DO ATIVO</td>
                  <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:800,fontSize:13,color:X.blu}}>{brl(balanco.ativoTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* PASSIVO + PL */}
          <div>
            <div style={{padding:"10px 16px",background:"#FEF3C7",borderBottom:`1px solid ${X.bdr}`}}>
              <p style={{margin:0,fontWeight:700,fontSize:12,color:"#B45309",letterSpacing:.5}}>PASSIVO + PATRIMÔNIO LÍQUIDO</p>
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <tbody>
                <tr><td style={{...td_,fontWeight:700,fontSize:11,color:X.txt,paddingTop:10}}>PASSIVO CIRCULANTE</td>
                  <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:700,paddingTop:10}}>{brl(balanco.passivoCirculante)}</td></tr>
                <tr><td style={{...td_,paddingLeft:24,color:X.mut,fontSize:11}}>💸 Reembolsos a Sócios</td>
                  <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11}}>{brl(balanco.reembPendente)}</td></tr>
                <tr><td style={{...td_,paddingLeft:24,color:X.mut,fontSize:11}}>📋 Custos a Pagar</td>
                  <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11}}>{brl(balanco.custosPendentes)}</td></tr>
                <tr style={{height:6}}><td colSpan={2}></td></tr>
                <tr><td style={{...td_,fontWeight:700,fontSize:11}}>PASSIVO NÃO-CIRCULANTE</td>
                  <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:700}}>{brl(0)}</td></tr>
                <tr><td style={{...td_,paddingLeft:24,color:X.mut,fontSize:10,fontStyle:"italic"}}>(sem dívidas de longo prazo)</td>
                  <td style={{...td_}}></td></tr>
                <tr style={{height:6}}><td colSpan={2}></td></tr>
                <tr><td style={{...td_,fontWeight:700,fontSize:11,color:balanco.patrimonioLiquido>=0?X.grn:X.red}}>PATRIMÔNIO LÍQUIDO</td>
                  <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:700,color:balanco.patrimonioLiquido>=0?X.grn:X.red}}>{brl(balanco.patrimonioLiquido)}</td></tr>
                <tr><td style={{...td_,paddingLeft:24,color:X.mut,fontSize:11}}>Lucros Acumulados</td>
                  <td style={{...td_,textAlign:"right",fontFamily:mo,fontSize:11}}>{brl(balanco.patrimonioLiquido)}</td></tr>
                <tr style={{background:"#FEF3C7",borderTop:`2px solid ${X.bdr}`}}>
                  <td style={{...td_,fontWeight:800,fontSize:13,color:"#B45309"}}>TOTAL PASSIVO + PL</td>
                  <td style={{...td_,textAlign:"right",fontFamily:mo,fontWeight:800,fontSize:13,color:"#B45309"}}>{brl(balanco.passivoCirculante+balanco.patrimonioLiquido)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div style={{padding:"10px 16px",background:"#FEF3C7",borderTop:`1px solid ${X.bdr}`,fontSize:11,color:"#B45309"}}>
          ℹ️ Balanço simplificado — caixa = saldo dos DFs; estoque MP a custo; produtos acabados a custo de fabricação ({brl(balanco.custos40)}/40g, {brl(balanco.custos240)}/240g, {brl(balanco.custos500)}/500g)
        </div>
      </div>
    </>}

    {/* ══ CUPONS ══ */}
    {tab==="cupons"&&<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div><h1 style={{fontSize:22,fontWeight:700,margin:"0 0 4px"}}>🎟️ Cupons de Desconto</h1>
        <p style={{fontSize:13,color:X.mut,margin:0}}>{cupons.length} cupons • {cupons.filter(c=>c.ativo).length} ativos • Integrado ao Supabase</p></div>
        <div style={{display:"flex",gap:8}}>
          <Btn small onClick={fetchCupons}>🔄 Atualizar</Btn>
          <Btn primary small onClick={openNovoCupom}>+ Novo Cupom</Btn>
        </div>
      </div>

      {/* Cupons ativos */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:14,marginBottom:24}}>
        {cupons.map(c=>{
          const usos=cuponsUso.filter(u=>u.cupom_code===c.code);
          const totalDesc=usos.reduce((s,u)=>s+(+u.desconto_valor||0),0);
          const expirado=c.validade&&new Date(c.validade)<new Date();
          const esgotado=c.uso_maximo&&c.uso_atual>=c.uso_maximo;
          return<div key={c.id} style={{padding:18,background:X.card,borderRadius:12,border:`2px solid ${c.ativo&&!expirado&&!esgotado?X.grn:X.bdr}`,opacity:c.ativo?1:0.6}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:20,fontWeight:800,fontFamily:mo,letterSpacing:2}}>{c.code}</span>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                {c.ativo&&!expirado&&!esgotado?<Badge t="Ativo" c={X.grn} bg="#DCFCE7"/>:expirado?<Badge t="Expirado" c="#B45309" bg="#FEF3C7"/>:esgotado?<Badge t="Esgotado" c={X.red} bg="#FEE2E2"/>:<Badge t="Inativo" c={X.mut} bg={X.bg}/>}
                <button onClick={()=>{setEditCupom({...c,validade:c.validade||"",uso_maximo:c.uso_maximo||"",escopo:c.escopo||"pedido",limite_40:c.limite_40||"",limite_240:c.limite_240||"",limite_500:c.limite_500||"",limite_mel:c.limite_mel||"",restricao_emails:c.restricao_emails||"",restricao_telefones:c.restricao_telefones||"",uso_unico_por_cliente:!!c.uso_unico_por_cliente});setModal("editCupom")}} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,padding:2}} title="Editar">✏️</button>
                <button onClick={()=>deleteCupom(c.id,c.code)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,padding:2}} title="Excluir">🗑️</button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13}}>
              <div><span style={{color:X.mut}}>Desconto:</span> <strong>{c.tipo==="percentual"?`${c.valor}%`:brl(c.valor)}</strong> <span style={{fontSize:11,color:X.mut}}>em {escopoLabel(c.escopo)}</span></div>
              <div><span style={{color:X.mut}}>Usos:</span> <strong>{c.uso_atual}{c.uso_maximo?`/${c.uso_maximo}`:"/∞"}</strong></div>
              <div><span style={{color:X.mut}}>Validade:</span> <strong>{c.validade?fdt(c.validade):"Sem limite"}</strong></div>
              <div><span style={{color:X.mut}}>Desc. total:</span> <strong style={{color:totalDesc>0?X.grn:X.mut}}>{brl(totalDesc)}</strong></div>
            </div>
            {/* ─── Badges de restrições ─── */}
            {(()=>{
              const badges=[];
              const limites=[];
              if(c.limite_40)limites.push(`${c.limite_40}×40g`);
              if(c.limite_240)limites.push(`${c.limite_240}×240g`);
              if(c.limite_500)limites.push(`${c.limite_500}×500g`);
              if(limites.length>0)badges.push({t:`📏 máx ${limites.join(" / ")}`,c:"#B45309",bg:"#FEF3C7"});
              if(c.restricao_emails||c.restricao_telefones){
                const nE=c.restricao_emails?c.restricao_emails.split(",").filter(Boolean).length:0;
                const nT=c.restricao_telefones?c.restricao_telefones.split(",").filter(Boolean).length:0;
                badges.push({t:`👤 restrito (${nE+nT} cliente${nE+nT>1?"s":""})`,c:"#1E40AF",bg:"#DBEAFE"});
              }
              if(c.uso_unico_por_cliente)badges.push({t:"🔒 1x por cliente",c:"#6B21A8",bg:"#F3E8FF"});
              if(badges.length===0)return null;
              return<div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>{badges.map((b,i)=><Badge key={i} t={b.t} c={b.c} bg={b.bg}/>)}</div>;
            })()}
            <div style={{marginTop:10,display:"flex",gap:8}}>
              <Btn small onClick={()=>toggleCupom(c.id,c.ativo)}>{c.ativo?"⏸ Desativar":"▶️ Ativar"}</Btn>
            </div>
          </div>})}
        {cupons.length===0&&<p style={{color:X.mut,fontStyle:"italic"}}>Nenhum cupom cadastrado. Clique em "+ Novo Cupom".</p>}
      </div>

      {/* Histórico de uso */}
      {cuponsUso.length>0&&<>
        <h3 style={{fontSize:15,fontWeight:700,marginBottom:14}}>📋 Histórico de Uso</h3>
        <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,overflow:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:600}}>
            <thead><tr style={{background:X.bg}}>{["Cupom","Pedido","Cliente","Contato","Desconto","Data"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{cuponsUso.map(u=><tr key={u.id}>
              <td style={{...td_,fontFamily:mo,fontWeight:700}}>{u.cupom_code}</td>
              <td style={{...td_,fontFamily:mo,color:X.mut}}>{u.pedido_id||"—"}</td>
              <td style={{...td_,fontWeight:500}}>{u.cliente||"—"}</td>
              <td style={{...td_,fontSize:11,color:X.mut}}>{u.cliente_email||u.cliente_telefone||"—"}</td>
              <td style={{...td_,fontFamily:mo,color:X.grn,fontWeight:600}}>{brl(u.desconto_valor||0)}</td>
              <td style={{...td_,whiteSpace:"nowrap",color:X.mut}}>{u.created_at?fdt(u.created_at.split("T")[0]):"—"}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </>}
    </>}

    {/* ══ CONFIG ══ */}
    {tab==="config"&&<>
      <h1 style={{fontSize:22,fontWeight:700,margin:"0 0 4px"}}>⚙️ Configurações</h1>
      <p style={{fontSize:13,color:X.mut,margin:"0 0 20px"}}>Credenciais e integrações do sistema — clique em qualquer valor para copiar</p>

      {/* ═══ PERFIS DE LOGIN ═══ */}
      <div style={{background:X.card,borderRadius:10,border:`2px solid ${X.bdr}`,padding:20,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <h3 style={{margin:0,fontSize:14,fontWeight:700}}>👥 Perfis de Login — sócios</h3>
            <p style={{margin:"2px 0 0",fontSize:11,color:X.mut}}>Gerencie os 3 sócios. Clique em ✏️ pra editar nome, email, senha.</p>
          </div>
          <Btn small onClick={fetchUsuarios}>🔄 Atualizar</Btn>
        </div>
        {usuariosDb.length===0?<p style={{margin:0,fontSize:12,color:X.mut}}>Nenhum usuário cadastrado. Rode o SQL <code>02_usuarios_table.sql</code>.</p>:
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:10}}>
            {usuariosDb.map(u=><div key={u.id} style={{padding:"14px 16px",background:X.bg,borderRadius:8,border:`1px solid ${X.bdr}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <span style={{fontSize:13,fontWeight:700}}>{u.nome}</span>
                  <span style={{fontFamily:mo,fontSize:10,padding:"2px 6px",background:X.accL,color:X.acc,borderRadius:3,fontWeight:700}}>{u.username}</span>
                  {u.role==="admin"&&<span style={{fontSize:9,padding:"1px 6px",background:"#DCFCE7",color:X.grn,borderRadius:3,fontWeight:700}}>ADMIN</span>}
                  {u.ativo===false&&<span style={{fontSize:9,padding:"1px 6px",background:"#FEE2E2",color:X.red,borderRadius:3,fontWeight:700}}>INATIVO</span>}
                </div>
                <p style={{margin:0,fontSize:11,color:X.mut,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email||"—"}</p>
                <p style={{margin:"2px 0 0",fontSize:10,color:X.mut,fontFamily:mo}}>senha: {"•".repeat(Math.min(10,(u.senha||"").length))}</p>
              </div>
              <button onClick={()=>setUserEdit({...u})} title="Editar" style={{background:"#fff",border:`1px solid ${X.bdr}`,borderRadius:4,cursor:"pointer",fontSize:14,width:30,height:28}}>✏️</button>
            </div>)}
          </div>
        }
      </div>

      {/* ═══ FEATURE FLAGS — Pausar integrações ═══ */}
      <div style={{background:X.card,borderRadius:10,border:`2px solid ${X.bdr}`,padding:20,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <h3 style={{margin:0,fontSize:14,fontWeight:700}}>🔌 Integrações — Pausar / Ativar</h3>
            <p style={{margin:"2px 0 0",fontSize:11,color:X.mut}}>Desativa cada etapa sem precisar de deploy. Mudança é instantânea.</p>
          </div>
          <Btn small onClick={fetchFlags}>🔄 Atualizar</Btn>
        </div>
        {featureFlags.length===0?<p style={{margin:0,fontSize:12,color:X.mut}}>Nenhuma feature flag configurada. Rode o SQL <code>feature_flags.sql</code>.</p>:<div style={{display:"grid",gridTemplateColumns:"1fr",gap:8}}>
          {featureFlags.map(ff=>{
            const critical=ff.key==="supabase";
            return<div key={ff.key} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 14px",background:ff.enabled?(critical?"#FEF3C7":"#DCFCE7"):"#FEE2E2",borderRadius:8,border:`1px solid ${ff.enabled?(critical?"#F59E0B":X.grn):X.red}`}}>
              <button onClick={()=>toggleFlag(ff.key,ff.enabled)} style={{background:"none",border:"none",cursor:"pointer",fontSize:24,padding:0,lineHeight:1}} title={ff.enabled?"Pausar":"Ativar"}>
                {ff.enabled?"🟢":"⏸️"}
              </button>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <code style={{fontSize:13,fontWeight:700,fontFamily:mo}}>{ff.key}</code>
                  {critical&&<Badge t="crítico" c="#B45309" bg="#FEF3C7"/>}
                  <span style={{fontSize:11,color:ff.enabled?X.grn:X.red,fontWeight:700}}>{ff.enabled?"ATIVO":"PAUSADO"}</span>
                </div>
                <p style={{margin:"2px 0 0",fontSize:11,color:X.mut}}>{ff.description||"—"}</p>
              </div>
              <div style={{fontSize:10,color:X.mut,textAlign:"right",whiteSpace:"nowrap"}}>
                {ff.updated_at?fdt(ff.updated_at.split("T")[0]):""}
                {ff.updated_by&&<div>{ff.updated_by}</div>}
              </div>
            </div>;
          })}
        </div>}
        <p style={{margin:"12px 0 0",fontSize:11,color:X.mut}}>💡 As flags são consumidas pelo site a cada carregamento. Efeito é imediato para novos pedidos.</p>
      </div>

      {/* ═══ FRETE — Endereço de centro + faixas configuráveis ═══ */}
      <FreteConfigSection config={freteConfig} onSave={saveFreteConfig} onGeocode={geocodeEndereco} loading={freteConfigLoading} geocoding={freteConfigGeocoding} show={show}/>

      {(()=>{
        const copy=(v)=>{navigator.clipboard.writeText(v);show(`📋 Copiado`);};
        const Field=({label,value,secret})=>{
          const[shown,setShown]=useState(!secret);
          return<div style={{padding:"10px 14px",background:X.bg,borderRadius:6,cursor:"pointer"}} onClick={()=>copy(value)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <p style={{margin:0,fontSize:11,color:X.mut,fontWeight:600,textTransform:"uppercase"}}>{label}</p>
              {secret&&<button onClick={e=>{e.stopPropagation();setShown(!shown);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:X.mut}}>{shown?"🙈 Ocultar":"👁️ Mostrar"}</button>}
            </div>
            <p style={{margin:0,fontSize:11,fontFamily:mo,wordBreak:"break-all",color:X.txt}}>{shown?value:"•".repeat(Math.min(60,value.length))}</p>
          </div>;
        };
        const Section=({title,icon,children,url})=><div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,padding:20,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <h3 style={{margin:0,fontSize:14,fontWeight:700}}>{icon} {title}</h3>
            {url&&<a href={url} target="_blank" rel="noreferrer" style={{fontSize:11,color:X.blu,textDecoration:"none"}}>🔗 Abrir painel</a>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{children}</div>
        </div>;
        return<>
          <Section title="Supabase — Base de Dados" icon="🗄️" url="https://supabase.com/dashboard/project/ownpsdvraqcnufjftjvk">
            <Field label="Project ID" value="ownpsdvraqcnufjftjvk"/>
            <Field label="Region" value="South America (São Paulo)"/>
            <Field label="URL" value={SUPA_URL}/>
            <Field label="Anon Key (public)" value={SUPA_KEY} secret/>
            <Field label="REST Endpoint" value={`${SUPA_URL}/rest/v1/`}/>
            <Field label="SQL Editor" value={`https://supabase.com/dashboard/project/ownpsdvraqcnufjftjvk/sql/new`}/>
          </Section>

          <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,padding:20,marginBottom:16,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:200}}>
              <h3 style={{margin:"0 0 4px",fontSize:14,fontWeight:700}}>🔄 Recalcular alocações</h3>
              <p style={{margin:0,fontSize:11,color:X.mut}}>Força popular unidades + realocar pedidos ({pedidoLotes.filter(pl=>!String(pl.pedido_num||"").startsWith("BX-")).length} alocações, {unidadesDb.length} unidades registradas)</p>
            </div>
            <Btn primary onClick={async()=>{
              show("⏳ Recalculando...");
              await reconciliar();
              show("✅ Tudo recalculado");
            }}>🔄 Realocar agora</Btn>
          </div>

          <div style={{background:"#FEF3C7",borderRadius:10,border:"1px solid #F59E0B40",padding:20,marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <h3 style={{margin:"0 0 4px",fontSize:14,fontWeight:700,color:"#B45309"}}>🩹 Backfill de baixas sem alocação</h3>
              <p style={{margin:0,fontSize:11,color:"#B45309"}}>Cria alocações BX-* na pedido_lotes pra baixas que foram registradas sem alocação FIFO. Resolve casos onde o estoque do lote não desconta a baixa.</p>
            </div>
            <Btn primary onClick={async()=>{
              show("⏳ Procurando baixas órfãs...");
              try{
                // 1. Busca todas as baixas
                const r=await fetch(`${SUPA_URL}/rest/v1/baixas?select=*`,{headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`}});
                const todasBaixas=await r.json();
                if(!Array.isArray(todasBaixas)){show("❌ Erro ao buscar baixas");return;}
                
                // 2. Busca todas as alocações BX- existentes
                const r2=await fetch(`${SUPA_URL}/rest/v1/pedido_lotes?pedido_num=like.BX-*&select=pedido_num`,{headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`}});
                const alocacoesBx=await r2.json();
                const idsAlocados=new Set((Array.isArray(alocacoesBx)?alocacoesBx:[]).map(a=>String(a.pedido_num).replace("BX-","")).map(s=>parseInt(s)));
                
                // 3. Filtra baixas sem alocação
                const orfas=todasBaixas.filter(b=>(b.qtd_40>0||b.qtd_240>0||b.qtd_500>0)&&!idsAlocados.has(b.id));
                
                if(orfas.length===0){show("✅ Nenhuma baixa órfã encontrada");return;}
                
                // 4. Pra cada uma, calcula FIFO usando o estado atual e cria alocação
                // Itera em ordem cronológica pra preservar consistência
                const orfasOrd=orfas.sort((a,b)=>(a.data||"").localeCompare(b.data||""));
                
                // Snapshot dinâmico do disponível (vai sendo decrementado conforme aloca)
                const dispWork={};
                lotesCalc.forEach(l=>{dispWork[l.id]={d40:l.disp40,d240:l.disp240,d500:l.disp500,data:l.data}});
                
                let processadas=0,faltaTotal=0;
                for(const b of orfasOrd){
                  let r40=b.qtd_40||0,r240=b.qtd_240||0,r500=b.qtd_500||0;
                  const alocsBx=[];
                  // FIFO sobre dispWork
                  const lotesOrd=Object.entries(dispWork).sort((a,b)=>(a[1].data||"").localeCompare(b[1].data||""));
                  for(const[loteId,disp]of lotesOrd){
                    if(r40<=0&&r240<=0&&r500<=0)break;
                    const t40=Math.min(r40,disp.d40||0);
                    const t240=Math.min(r240,disp.d240||0);
                    const t500=Math.min(r500,disp.d500||0);
                    if(t40+t240+t500>0){
                      alocsBx.push({lote_id:loteId,qtd_40:t40,qtd_240:t240,qtd_500:t500});
                      disp.d40-=t40;disp.d240-=t240;disp.d500-=t500;
                      r40-=t40;r240-=t240;r500-=t500;
                    }
                  }
                  // Se sobrou, força no lote mais antigo
                  if(r40+r240+r500>0&&lotesOrd.length>0){
                    const[loteAntigoId]=lotesOrd[0];
                    const exists=alocsBx.find(a=>a.lote_id===loteAntigoId);
                    if(exists){exists.qtd_40+=r40;exists.qtd_240+=r240;exists.qtd_500+=r500;}
                    else alocsBx.push({lote_id:loteAntigoId,qtd_40:r40,qtd_240:r240,qtd_500:r500});
                    faltaTotal+=r40+r240+r500;
                    r40=0;r240=0;r500=0;
                  }
                  // Grava
                  if(alocsBx.length>0){
                    const payload=alocsBx.map(a=>({pedido_num:`BX-${b.id}`,lote_id:a.lote_id,qtd_40:+a.qtd_40||0,qtd_240:+a.qtd_240||0,qtd_500:+a.qtd_500||0,status:"confirmada",confirmada_em:new Date().toISOString()}));
                    try{
                      await fetch(`${SUPA_URL}/rest/v1/pedido_lotes`,{method:"POST",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(payload)});
                      processadas++;
                    }catch(e){console.warn("[backfill] erro baixa",b.id,e);}
                  }
                }
                show(`✅ ${processadas}/${orfas.length} baixas regularizadas${faltaTotal>0?` (${faltaTotal} forçadas)`:""}`);
                sync();
              }catch(e){show(`❌ ${e.message}`);console.error(e);}
            }}>🩹 Regularizar baixas</Btn>
          </div>

          <div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,padding:20,marginBottom:16}}>
            <h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:700}}>📋 Tabelas Supabase ativas</h3>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8}}>
              {[
                {n:"pedidos",c:vendas.filter(v=>v._fromSupabase).length,d:"Vendas (52+novas)"},
                {n:"clientes",c:clientes.length,d:"CRM auto"},
                {n:"cupons",c:cupons.length,d:"Descontos"},
                {n:"cupons_uso",c:cuponsUso.length,d:"Histórico uso"},
                {n:"lotes",c:lotes.length,d:"Produção"},
                {n:"ingredientes",c:ing.length,d:"Matéria-prima"},
                {n:"embalagens",c:emb.length,d:"Pacotes/Adesivos"},
                {n:"custos",c:custos.length,d:"Despesas"},
                {n:"baixas",c:baixas.length,d:"Amostras/Perdas"},
                {n:"pedido_lotes",c:pedidoLotes.length,d:"Alocações FIFO"},
                {n:"lotes_disponibilidade",c:0,d:"⚠️ View removida — cálculo client-side"},
              ].map(t=><div key={t.n} style={{padding:"10px 12px",background:X.bg,borderRadius:6}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                  <span style={{fontSize:12,fontWeight:700,fontFamily:mo}}>{t.n}</span>
                  <span style={{fontSize:11,fontWeight:700,color:X.acc,fontFamily:mo}}>{t.c}</span>
                </div>
                <p style={{margin:"2px 0 0",fontSize:10,color:X.mut}}>{t.d}</p>
              </div>)}
            </div>
          </div>

          <Section title="InfinitiPay — Pagamentos" icon="💳" url="https://app.infinitepay.io">
            <Field label="Handle" value={SITE_CFG.infinitipayHandle}/>
            <Field label="API Endpoint" value="https://api.infinitepay.io/invoices/public/checkout/links"/>
            <Field label="Fallback URL" value={SITE_CFG.infinitipayFallbackUrl}/>
            <Field label="Proxy (site)" value={`${SITE_CFG.siteUrl}/api/checkout`}/>
          </Section>

          <Section title="EmailJS — Envio de Emails" icon="📧" url="https://dashboard.emailjs.com">
            <Field label="Public Key" value={SITE_CFG.emailjsPublicKey} secret/>
            <Field label="Service (Owner)" value={SITE_CFG.emailjsOwnerService||"service_seg2uxg"}/>
            <Field label="Template (Owner)" value={SITE_CFG.emailjsOwnerTemplate||"template_1ay263j"}/>
            <Field label="Service (Customer)" value={SITE_CFG.emailjsCustomerService||"service_qygdida"}/>
            <Field label="Template (Customer)" value={SITE_CFG.emailjsCustomerTemplate||"template_j5k1xg4"}/>
          </Section>

          <Section title="Z-API — WhatsApp" icon="💬" url="https://app.z-api.io">
            <Field label="Instance ID" value={SITE_CFG.zapiInstance} secret/>
            <Field label="Token" value={SITE_CFG.zapiToken} secret/>
            <Field label="Client-Token" value="F4d697803a4b14b5d9170e716aaad4faaS" secret/>
            <Field label="Grupo Pedidos" value={SITE_CFG.whatsappGroupPedidos}/>
            <Field label="Grupo Entregas" value={SITE_CFG.whatsappGroupEntregas}/>
            <Field label="Link Cliente" value="https://wa.me/message/HGTONE2IW6R7I1"/>
          </Section>

          <Section title="Google Sheets — Planilha (legado)" icon="📊" url={`https://docs.google.com/spreadsheets/d/${SITE_CFG.sheetsSpreadsheetId}`}>
            <Field label="Spreadsheet ID" value={SITE_CFG.sheetsSpreadsheetId}/>
            <Field label="Aba principal" value="Pedidos (21 colunas)"/>
          </Section>

          <Section title="Vercel — Deploy" icon="▲" url="https://vercel.com/dashboard">
            <Field label="Site (loja)" value={SITE_CFG.siteUrl}/>
            <Field label="Admin" value={ADMIN_URL}/>
            <Field label="Repo Site" value="github.com/caiokroc/kroc-granola"/>
            <Field label="Repo Admin" value="github.com/caiokroc/kroc-admin"/>
          </Section>

          <div style={{background:"#FEF3C7",border:"2px solid #F59E0B",borderRadius:10,padding:16,marginTop:16}}>
            <p style={{margin:0,fontSize:12,fontWeight:700,color:"#B45309"}}>⚠️ A chave Anon do Supabase é pública por design</p>
            <p style={{margin:"6px 0 0",fontSize:11,color:"#92400E"}}>Ela roda no navegador e tem permissões controladas por Row Level Security (RLS). Para operações privilegiadas, use a Service Role Key (nunca exposta no frontend).</p>
          </div>
        </>;
      })()}
    </>}

    </div></div>

    {/* ═══ MODALS ═══ */}
    {modal==="logbook"&&logbookLote&&(()=>{
      const l=logbookLote;
      // Todas alocações desse lote, ordenadas cronologicamente
      const allAlocs=pedidoLotes.filter(pl=>pl.lote_id===l.id).map(pl=>{
        const isBaixa=pl.pedido_num.startsWith("BX-");
        const venda=!isBaixa?vendas.find(v=>v.id===pl.pedido_num):null;
        const baixa=isBaixa?baixas.find(b=>`BX-${b._supaId}`===pl.pedido_num||`BX-${b.id}`===pl.pedido_num):null;
        return{
          ...pl,
          isBaixa,
          venda,baixa,
          data:venda?.data||baixa?.data||pl.created_at,
          cliente:venda?.comp||baixa?.motivo||"—",
          created_at:pl.created_at
        };
      }).sort((a,b)=>(a.created_at||"").localeCompare(b.created_at||""));

      // Totais
      const total40=allAlocs.reduce((s,a)=>s+(a.qtd_40||0),0);
      const total240=allAlocs.reduce((s,a)=>s+(a.qtd_240||0),0);
      const total500=allAlocs.reduce((s,a)=>s+(a.qtd_500||0),0);
      const rest40=(l.p40||0)-total40;
      const rest240=(l.p240||0)-total240;
      const rest500=(l.p500||0)-total500;

      return<Modal title={`📖 Logbook — ${l.id}`} onClose={()=>setModal(null)} wide>
        {/* Header do lote */}
        <div style={{padding:"14px 16px",background:X.bg,borderRadius:10,marginBottom:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,fontSize:12}}>
            <div><span style={{color:X.mut,fontSize:10,textTransform:"uppercase",fontWeight:700}}>Produzido em</span><p style={{margin:"4px 0 0",fontWeight:600}}>{fdt(l.data)}</p></div>
            <div><span style={{color:X.mut,fontSize:10,textTransform:"uppercase",fontWeight:700}}>Validade</span><p style={{margin:"4px 0 0",fontWeight:600}}>{fdt(new Date(new Date(l.data).getTime()+45*864e5).toISOString())}</p></div>
            <div><span style={{color:X.mut,fontSize:10,textTransform:"uppercase",fontWeight:700}}>Total</span><p style={{margin:"4px 0 0",fontWeight:600}}>{(l.kg||0).toFixed(2)} kg</p></div>
            <div><span style={{color:X.mut,fontSize:10,textTransform:"uppercase",fontWeight:700}}>Status</span><p style={{margin:"4px 0 0",fontWeight:600,color:l.dias<=0?X.red:l.dias<=7?"#B45309":X.grn}}>{l.dias<=0?"❌ Vencido":`${l.dias}d restantes`}</p></div>
          </div>
        </div>

        {/* Balanço por SKU */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
          {[
            ["40g",l.p40||0,total40,rest40,"#F59E0B","#FEF3C7"],
            ["240g",l.p240||0,total240,rest240,"#2563EB","#DBEAFE"],
            ["500g",l.p500||0,total500,rest500,"#7C3AED","#F3E8FF"]
          ].map(([tag,prod,cons,rest,cor,bg])=><div key={tag} style={{padding:"12px 14px",background:bg+"60",borderRadius:8,border:`1px solid ${cor}30`}}>
            <p style={{margin:0,fontSize:13,fontWeight:700,color:cor}}>{tag}</p>
            <div style={{fontSize:11,color:X.mut,marginTop:6}}>
              <div>Produzido: <strong style={{fontFamily:mo,color:X.txt}}>{prod}</strong></div>
              <div>Consumido: <strong style={{fontFamily:mo,color:X.txt}}>{cons}</strong></div>
              <div>Restante: <strong style={{fontFamily:mo,color:rest>0?X.grn:X.mut}}>{rest}</strong></div>
            </div>
          </div>)}
        </div>

        {/* Linha do tempo de saídas */}
        <h4 style={{margin:"0 0 10px",fontSize:13,fontWeight:700}}>🔍 Rastreamento de saídas ({allAlocs.length} {allAlocs.length===1?"movimento":"movimentos"})</h4>
        {allAlocs.length===0?<div style={{padding:24,textAlign:"center",background:X.bg,borderRadius:10,color:X.mut,fontSize:13}}>
          Nenhuma saída registrada desse lote ainda. Todas as unidades continuam em estoque.
        </div>:<div style={{background:X.card,borderRadius:10,border:`1px solid ${X.bdr}`,overflow:"auto",maxHeight:400}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead style={{position:"sticky",top:0,background:X.bg,zIndex:1}}><tr>
              <th style={{...th,textAlign:"left"}}>Data</th>
              <th style={{...th,textAlign:"left"}}>Pedido/Baixa</th>
              <th style={{...th,textAlign:"left"}}>Destino</th>
              <th style={{...th,textAlign:"center"}}>40g</th>
              <th style={{...th,textAlign:"center"}}>240g</th>
              <th style={{...th,textAlign:"center"}}>500g</th>
              <th style={th}></th>
            </tr></thead>
            <tbody>{allAlocs.map((a,i)=><tr key={i} style={{borderTop:`1px solid ${X.bdr}`}}>
              <td style={{...td_,whiteSpace:"nowrap",color:X.mut}}>{a.data?fds(a.data):"—"}</td>
              <td style={{...td_,fontFamily:mo,fontWeight:600}}>
                {a.isBaixa?<span style={{color:"#9333EA"}}>📉 {a.baixa?`BX-${a.baixa._supaId||a.baixa.id}`:a.pedido_num}</span>:<span>{a.pedido_num}</span>}
              </td>
              <td style={{...td_,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis"}}>
                {a.isBaixa?<span style={{color:X.mut,fontStyle:"italic"}}>{a.cliente} ({a.baixa?.cat||"baixa"})</span>:<strong>{a.cliente}</strong>}
              </td>
              <td style={{...td_,textAlign:"center",fontFamily:mo}}>{a.qtd_40||"—"}</td>
              <td style={{...td_,textAlign:"center",fontFamily:mo}}>{a.qtd_240||"—"}</td>
              <td style={{...td_,textAlign:"center",fontFamily:mo}}>{a.qtd_500||"—"}</td>
              <td style={td_}>
                {a.venda&&<button onClick={()=>{setModal(null);setTimeout(()=>openDetalhesVenda(a.venda),50);}} style={{background:X.acc,color:"#FFF",border:"none",padding:"3px 8px",borderRadius:4,cursor:"pointer",fontSize:10,fontWeight:600}}>Ver →</button>}
              </td>
            </tr>)}</tbody>
          </table>
        </div>}

        <p style={{fontSize:11,color:X.mut,margin:"12px 0 0"}}>💡 FIFO: quando um pedido precisa de mais unidades do que um lote tem, o sistema consome também do próximo lote mais antigo. Um pedido pode aparecer em vários logbooks.</p>

        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:16}}>
          <Btn onClick={()=>setModal(null)}>Fechar</Btn>
        </div>
      </Modal>;
    })()}

    {modal==="detalhesCliente"&&clienteDetalhes&&(()=>{
      const c=clienteDetalhes;
      const pedidosDoCliente=vendas.filter(v=>{
        const e=(v._email||"").toLowerCase().trim();
        const t=telDigits(v._tel);
        return (c.email&&e===c.email.toLowerCase())||(c.tel&&t===telDigits(c.tel))||v.comp===c.nome;
      }).sort((a,b)=>(b.data||"").localeCompare(a.data||""));
      return<Modal title={`👤 ${c.codigo} — ${c.nome}`} onClose={()=>setModal(null)} wide>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div style={{padding:"14px 16px",background:X.bg,borderRadius:10}}>
            <h4 style={{margin:"0 0 10px",fontSize:11,fontWeight:700,color:X.mut,textTransform:"uppercase",letterSpacing:.5}}>📞 Contato</h4>
            <p style={{margin:"0 0 4px",fontSize:13,fontWeight:600}}>{c.nome}</p>
            {c.tel&&<p style={{margin:"0 0 4px",fontSize:12,fontFamily:mo}}>📱 {fmtTel(c.tel)}</p>}
            {c.email&&<p style={{margin:"0 0 4px",fontSize:12,color:X.mut}}>📧 {c.email}</p>}
            {(c.end||c.bairro)&&<p style={{margin:"6px 0 0",fontSize:12}}>📍 {[c.end,c.numero,c.comp_end,c.bairro].filter(x=>x&&x!=="-").join(", ")}{c.cep?` • CEP ${c.cep}`:""}</p>}
            {c.obs&&<p style={{margin:"6px 0 0",fontSize:11,color:X.mut,fontStyle:"italic"}}>📝 {c.obs}</p>}
          </div>
          <div style={{padding:"14px 16px",background:X.bg,borderRadius:10}}>
            <h4 style={{margin:"0 0 10px",fontSize:11,fontWeight:700,color:X.mut,textTransform:"uppercase",letterSpacing:.5}}>📊 Estatísticas</h4>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12}}>
              <div><span style={{color:X.mut}}>Pedidos:</span> <strong>{c.compras}</strong></div>
              <div><span style={{color:X.mut}}>Total:</span> <strong style={{fontFamily:mo,color:X.acc}}>{brl(c.total)}</strong></div>
              <div><span style={{color:X.mut}}>Lucro:</span> <strong style={{fontFamily:mo,color:c.lucro>=0?X.grn:X.red}}>{brl(c.lucro)}</strong></div>
              <div><span style={{color:X.mut}}>Ticket médio:</span> <strong style={{fontFamily:mo}}>{brl(c.compras>0?c.total/c.compras:0)}</strong></div>
              <div><span style={{color:X.mut}}>Primeira:</span> <strong>{c.primeiraCompra?fds(c.primeiraCompra):"—"}</strong></div>
              <div><span style={{color:X.mut}}>Última:</span> <strong>{c.ultimaCompra?fds(c.ultimaCompra):"—"}</strong></div>
            </div>
            <div style={{marginTop:10,padding:"8px 10px",background:"#fff",borderRadius:6}}>
              <p style={{margin:0,fontSize:11,color:X.mut}}>Produtos comprados</p>
              <div style={{marginTop:4}}><ProdChips q40={c.q40} q240={c.q240} q500={c.q500} qMel={c.qMel}/></div>
            </div>
          </div>
        </div>
        {pedidosDoCliente.length>0&&<div style={{padding:"12px 14px",background:X.bg,borderRadius:10,marginBottom:14,maxHeight:280,overflow:"auto"}}>
          <h4 style={{margin:"0 0 10px",fontSize:11,fontWeight:700,color:X.mut,textTransform:"uppercase",letterSpacing:.5}}>📋 Histórico de Pedidos ({pedidosDoCliente.length})</h4>
          <table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}>
            <thead><tr style={{color:X.mut,fontSize:10,textTransform:"uppercase"}}>
              <th style={{textAlign:"left",padding:"4px 0"}}>#</th>
              <th style={{textAlign:"left",padding:"4px 0"}}>Data</th>
              <th style={{textAlign:"left",padding:"4px 0"}}>Produtos</th>
              <th style={{textAlign:"right",padding:"4px 0"}}>Total</th>
              <th style={{textAlign:"center",padding:"4px 0"}}>Status</th>
            </tr></thead>
            <tbody>{pedidosDoCliente.map(v=><tr key={v.id} style={{borderTop:`1px solid ${X.bdr}`,cursor:"pointer"}} onClick={()=>{setModal(null);openDetalhesVenda(v);}}>
              <td style={{padding:"6px 0",fontFamily:mo,fontWeight:600}}>{v.id}</td>
              <td style={{padding:"6px 0"}}>{fds(v.data)}</td>
              <td style={{padding:"6px 0"}}><ProdChips q40={v.q40} q240={v.q240} q500={v.q500} qMel={v.qMel}/></td>
              <td style={{padding:"6px 0",textAlign:"right",fontFamily:mo,fontWeight:600}}>{brl(v.rec)}</td>
              <td style={{padding:"6px 0",textAlign:"center",fontSize:11}}>{v.entreg?<span style={{color:X.grn}}>✓ Entregue</span>:<span style={{color:X.red}}>⏳ Pendente</span>}</td>
            </tr>)}</tbody>
          </table>
        </div>}
        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <Btn onClick={()=>setModal(null)}>Fechar</Btn>
          <Btn primary onClick={()=>{setModal(null);openEditCliente(c);}}>✏️ Editar</Btn>
        </div>
      </Modal>;
    })()}

    {modal==="editCliente"&&clienteEdit&&(()=>{
      const c=clienteEdit;
      return<Modal title={c._supaId?`✏️ Editar ${c.codigo} — ${c.nome}`:`➕ Novo cliente (${c.codigo})`} onClose={()=>setModal(null)} wide>
        <FormSection title="Identificação" cols="1fr 2fr">
          <Inp label="Código" value={c.codigo} onChange={v=>setClienteEdit({...c,codigo:v})} mono/>
          <Inp label="Nome completo *" value={c.nome} onChange={v=>setClienteEdit({...c,nome:v})}/>
        </FormSection>
        <FormSection title="Contato" cols="1fr 1fr">
          <Inp label="Email" value={c.email} onChange={v=>setClienteEdit({...c,email:v})}/>
          <Inp label="Telefone" value={c.tel} onChange={v=>setClienteEdit({...c,tel:v})} placeholder="11999998888"/>
        </FormSection>
        <FormSection title="Endereço" cols="3fr 1fr 2fr">
          <Inp label="Rua" value={c.end} onChange={v=>setClienteEdit({...c,end:v})}/>
          <Inp label="Número" value={c.numero} onChange={v=>setClienteEdit({...c,numero:v})}/>
          <Inp label="Complemento" value={c.comp_end} onChange={v=>setClienteEdit({...c,comp_end:v})}/>
        </FormSection>
        <FormSection title="Localização" cols="2fr 1fr 1fr 1fr">
          <Inp label="Bairro" value={c.bairro} onChange={v=>setClienteEdit({...c,bairro:v})}/>
          <Inp label="Cidade" value={c.cidade} onChange={v=>setClienteEdit({...c,cidade:v})}/>
          <Inp label="UF" value={c.estado} onChange={v=>setClienteEdit({...c,estado:v.toUpperCase().slice(0,2)})}/>
          <Inp label="CEP" value={c.cep} onChange={v=>setClienteEdit({...c,cep:v})}/>
        </FormSection>
        <FormSection title="Observações" cols="1fr">
          <Inp label="Anotações internas" value={c.obs} onChange={v=>setClienteEdit({...c,obs:v})} placeholder="Preferências, notas..."/>
        </FormSection>
        <div style={{display:"flex",justifyContent:"space-between",gap:10,marginTop:16}}>
          <div>{c._supaId&&<Btn onClick={()=>{setModal(null);deleteCliente(c);}} style={{background:"#FEE2E2",color:X.red,border:`1px solid #FCA5A5`}}>🗑️ Excluir</Btn>}</div>
          <div style={{display:"flex",gap:10}}>
            <Btn onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn primary onClick={saveCliente}>💾 Salvar</Btn>
          </div>
        </div>
      </Modal>;
    })()}

    {userEdit&&(()=>{
      return<Modal title={`✏️ Editar perfil — ${userEdit.nome}`} onClose={()=>setUserEdit(null)}>
        <FormSection title="Identificação" cols="1fr 1fr">
          <Inp label="Username" value={userEdit.username} onChange={v=>setUserEdit({...userEdit,username:v.toLowerCase()})} mono/>
          <Inp label="Nome" value={userEdit.nome} onChange={v=>setUserEdit({...userEdit,nome:v})}/>
        </FormSection>
        <FormSection title="Acesso" cols="1fr 1fr">
          <Inp label="Email" value={userEdit.email||""} onChange={v=>setUserEdit({...userEdit,email:v})}/>
          <Inp label="Senha" value={userEdit.senha||""} onChange={v=>setUserEdit({...userEdit,senha:v})}/>
        </FormSection>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:X.bg,borderRadius:8,marginBottom:14}}>
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12}}>
            <input type="checkbox" checked={userEdit.ativo!==false} onChange={e=>setUserEdit({...userEdit,ativo:e.target.checked})}/>
            <span>Ativo (pode fazer login)</span>
          </label>
        </div>
        <div style={{padding:"10px 12px",background:"#FEF3C7",borderRadius:8,marginBottom:14,border:"1px solid #F59E0B40"}}>
          <p style={{margin:0,fontSize:11,color:"#B45309"}}>⚠️ <strong>Atenção</strong>: mudanças são aplicadas imediatamente. O usuário precisa fazer logout e login de novo pra usar a nova senha.</p>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <Btn onClick={()=>setUserEdit(null)}>Cancelar</Btn>
          <Btn primary onClick={saveUsuario}>💾 Salvar</Btn>
        </div>
      </Modal>;
    })()}

    {modal==="detalhesCusto"&&detalhesCusto&&(()=>{
      const c=detalhesCusto;
      const pags=custoPagamentos.filter(p=>p.custoId===c._supaId);
      const totPago=pags.reduce((s,p)=>s+(+p.valorPago||0),0);
      const totReembPend=pags.reduce((s,p)=>s+(+p.reembPendente||0),0);
      const totReembQuit=pags.reduce((s,p)=>s+(+p.reembQuitado||0),0);
      return<Modal title={`💸 ${c.desp}`} onClose={()=>setModal(null)}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div style={{padding:"12px 14px",background:X.bg,borderRadius:10}}>
            <h4 style={{margin:"0 0 8px",fontSize:11,fontWeight:700,color:X.mut,textTransform:"uppercase",letterSpacing:.5}}>📋 Dados</h4>
            <p style={{margin:"0 0 4px",fontSize:12}}><span style={{color:X.mut}}>Data:</span> <strong>{fdt(c.data)}</strong></p>
            <p style={{margin:"0 0 4px",fontSize:12}}><span style={{color:X.mut}}>Categoria:</span> <Badge t={c.cat} c="#059669" bg="#ECFDF5"/></p>
            <p style={{margin:"0 0 4px",fontSize:12}}><span style={{color:X.mut}}>Fornecedor:</span> <strong>{c.forn||"—"}</strong></p>
            {c.recorrente&&<p style={{margin:"0 0 4px",fontSize:12}}><span style={{color:X.mut}}>Tipo:</span> <span style={{background:"#FEF3C7",color:"#B45309",padding:"2px 8px",borderRadius:4,fontSize:11,fontWeight:700}}>🔄 Recorrente</span></p>}
            {c.desc&&<p style={{margin:"4px 0 0",fontSize:11,color:X.mut,fontStyle:"italic"}}>"{c.desc}"</p>}
          </div>
          <div style={{padding:"12px 14px",background:X.bg,borderRadius:10}}>
            <h4 style={{margin:"0 0 8px",fontSize:11,fontWeight:700,color:X.mut,textTransform:"uppercase",letterSpacing:.5}}>💰 Valores</h4>
            <p style={{margin:"0 0 4px",fontSize:14,fontFamily:mo,fontWeight:700}}>{brl(c.valor)}</p>
            <p style={{margin:"0 0 4px",fontSize:11,color:X.mut}}>Total da despesa</p>
            {totReembPend>0&&<p style={{margin:"8px 0 0",fontSize:12,color:X.red,fontWeight:600}}>⏳ Reemb. pendente: <span style={{fontFamily:mo}}>{brl(totReembPend)}</span></p>}
            {totReembQuit>0&&<p style={{margin:"4px 0 0",fontSize:12,color:X.grn,fontWeight:600}}>✅ Reemb. quitado: <span style={{fontFamily:mo}}>{brl(totReembQuit)}</span></p>}
          </div>
        </div>
        <div style={{padding:"12px 14px",background:X.bg,borderRadius:10,marginBottom:14}}>
          <h4 style={{margin:"0 0 8px",fontSize:11,fontWeight:700,color:X.mut,textTransform:"uppercase",letterSpacing:.5}}>👥 Pagadores ({pags.length||1})</h4>
          {pags.length===0?
            <p style={{margin:0,fontSize:13}}><strong>{c.pag||"—"}</strong> — <span style={{fontFamily:mo}}>{brl(c.valor)}</span></p>
            :<table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}>
              <thead><tr style={{color:X.mut,fontSize:10,textTransform:"uppercase"}}>
                <th style={{textAlign:"left",padding:"4px 0"}}>Pagador</th>
                <th style={{textAlign:"right",padding:"4px 0"}}>Pago</th>
                <th style={{textAlign:"right",padding:"4px 0"}}>Pend.</th>
                <th style={{textAlign:"right",padding:"4px 0"}}>Quit.</th>
              </tr></thead>
              <tbody>{pags.map(p=><tr key={p._supaId} style={{borderTop:`1px solid ${X.bdr}`}}>
                <td style={{padding:"6px 0",fontWeight:600}}>{p.pagador}</td>
                <td style={{padding:"6px 0",textAlign:"right",fontFamily:mo}}>{brl(p.valorPago)}</td>
                <td style={{padding:"6px 0",textAlign:"right",fontFamily:mo,color:p.reembPendente>0?X.red:X.mut}}>{p.reembPendente>0?brl(p.reembPendente):"—"}</td>
                <td style={{padding:"6px 0",textAlign:"right",fontFamily:mo,color:p.reembQuitado>0?X.grn:X.mut}}>{p.reembQuitado>0?brl(p.reembQuitado):"—"}</td>
              </tr>)}</tbody>
            </table>}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <Btn onClick={()=>setModal(null)}>Fechar</Btn>
          <Btn primary onClick={()=>{setModal(null);openEditCusto(c);}}>✏️ Editar</Btn>
        </div>
      </Modal>;
    })()}

    {modal==="detalhesVenda"&&detalhesVenda&&(()=>{
      const v=detalhesVenda;
      const alocs=alocacoesDoPedido(v.id);
      const addr=ga(v.comp);
      const telFmt=fmtTel(v._tel||addr.tel);
      const email=(v._email||addr.email||"").toLowerCase();
      const endFull=[v._rua||addr.rua,v._num].filter(Boolean).join(", ");
      const compFull=v._comp||addr.comp||"";
      const bairro=v._bairro||"";
      const cep=v._cep||"";
      const statusChip=(label,val)=>{
        const isOn=val;
        return<span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:isOn?"#DCFCE7":"#FEF3C7",color:isOn?X.grn:"#B45309"}}>{isOn?"✓":"⏳"} {label}</span>;
      };
      return<Modal title={`📋 ${v.id} — ${v.comp}`} onClose={()=>setModal(null)} wide>
        {/* Cabeçalho com status */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
          {statusChip("Produzido",v.prod)}
          {statusChip("Entregue",v.entreg)}
          {statusChip("Pago",v.pago)}
          <Badge t={v.tipo} c={v.tipo==="Amostra"?"#7C3AED":"#059669"} bg={v.tipo==="Amostra"?"#F3E8FF":"#ECFDF5"}/>
          <Badge t={v.canal} c={X.blu} bg="#DBEAFE"/>
        </div>

        {/* 2 colunas: dados do pedido + cliente */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
          <div style={{padding:"14px 16px",background:X.bg,borderRadius:10}}>
            <h4 style={{margin:"0 0 10px",fontSize:12,fontWeight:700,color:X.mut,textTransform:"uppercase",letterSpacing:0.5}}>📦 Pedido</h4>
            <p style={{margin:"0 0 4px",fontSize:12}}><span style={{color:X.mut}}>Data:</span> <strong>{fdt(v.data)}</strong></p>
            <p style={{margin:"0 0 4px",fontSize:12}}><span style={{color:X.mut}}>Produtos:</span></p>
            <div style={{marginLeft:8,marginBottom:6}}>
              {v.q40>0&&<div style={{fontSize:13}}>• {v.q40}x Kroc 40g</div>}
              {v.q240>0&&<div style={{fontSize:13}}>• {v.q240}x Kroc 240g</div>}
              {v.q500>0&&<div style={{fontSize:13}}>• {v.q500}x Kroc 500g</div>}
              {(v.qMel||0)>0&&<div style={{fontSize:13,color:"#CA8A04",fontWeight:600}}>• {v.qMel}x 🍯 Mel Silvestre 300g</div>}
            </div>
            <p style={{margin:"0 0 4px",fontSize:12}}><span style={{color:X.mut}}>Frete:</span> <strong style={{fontFamily:mo}}>{brl(v.frete||0)}</strong></p>
            <p style={{margin:"0 0 4px",fontSize:12}}><span style={{color:X.mut}}>Receita:</span> <strong style={{fontFamily:mo,color:X.acc}}>{brl(v.rec)}</strong></p>
            <p style={{margin:"0 0 4px",fontSize:12}}><span style={{color:X.mut}}>Custo:</span> <strong style={{fontFamily:mo}}>{brl(v.custo||0)}</strong></p>
            <p style={{margin:"0 0 4px",fontSize:12}}><span style={{color:X.mut}}>Lucro:</span> <strong style={{fontFamily:mo,color:v.lucro>=0?X.grn:X.red}}>{brl(v.lucro||0)}</strong></p>
            <p style={{margin:"0 0 4px",fontSize:12}}><span style={{color:X.mut}}>Pagamento:</span> <strong>{v.met||"—"}</strong></p>
          </div>

          <div style={{padding:"14px 16px",background:X.bg,borderRadius:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <h4 style={{margin:0,fontSize:12,fontWeight:700,color:X.mut,textTransform:"uppercase",letterSpacing:0.5}}>👤 Cliente</h4>
              <button onClick={()=>{setClienteFocus(v.comp);setTab("clientes");setModal(null);}} style={{background:X.acc,color:"#FFF",border:"none",padding:"4px 10px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600}}>Ver cliente →</button>
            </div>
            <p style={{margin:"0 0 4px",fontSize:14,fontWeight:600}}>{v.comp}</p>
            {telFmt&&<p style={{margin:"0 0 4px",fontSize:12,fontFamily:mo}}>📱 {telFmt}</p>}
            {email&&<p style={{margin:"0 0 4px",fontSize:12,color:X.mut}}>📧 {email}</p>}
            {endFull&&<p style={{margin:"0 0 4px",fontSize:12}}>📍 {endFull}{compFull&&compFull!=="-"?" — "+compFull:""}</p>}
            {(bairro||cep)&&<p style={{margin:"0 0 4px",fontSize:12,color:X.mut}}>{bairro}{bairro&&cep?" • ":""}{cep?"CEP "+cep:""}</p>}
          </div>
        </div>

        {/* Alocações FIFO — de qual lote saiu + IDs das unidades */}
        <div style={{padding:"14px 16px",background:"#FEF3C7",borderRadius:10,border:"1px solid #F59E0B30",marginBottom:16}}>
          <h4 style={{margin:"0 0 10px",fontSize:12,fontWeight:700,color:"#B45309",textTransform:"uppercase",letterSpacing:0.5}}>🏭 Rastreamento — lote + unidades designadas</h4>
          {alocs.length===0?<p style={{margin:0,fontSize:12,color:X.mut}}>
            Nenhuma alocação registrada. {v.lote?`Campo lote do pedido: "${v.lote}"`:"Pedido antigo, sem rastreamento detalhado."}
          </p>:(()=>{
            // Pega todas as unidades do logbook que foram designadas a esse pedido
            const unidadesDoPedido=logbookUnidades.filter(u=>u.pedido===v.id);
            // Agrupa por lote + sku
            const grupos={};
            unidadesDoPedido.forEach(u=>{
              const k=`${u.lote_id}|${u.sku}`;
              if(!grupos[k])grupos[k]={lote:u.lote_id,lote_data:u.lote_data,sku:u.sku,statusAloc:u.statusAloc,unidades:[]};
              grupos[k].unidades.push(u);
            });
            const gruposArr=Object.values(grupos).sort((a,b)=>(a.lote_data||"").localeCompare(b.lote_data||"")||a.sku.localeCompare(b.sku));
            return<div>
              {gruposArr.map((g,i)=><div key={i} style={{marginBottom:10,padding:"10px 12px",background:"#fff",borderRadius:8,border:"1px solid #F59E0B40"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:6}}>
                  <span style={{fontFamily:mo,fontWeight:700,fontSize:13,padding:"2px 8px",background:"#FEF3C7",borderRadius:4,border:"1px solid #F59E0B60",color:"#B45309"}}>{g.lote}</span>
                  <span style={{fontSize:11,color:X.mut}}>{g.lote_data?fdt(g.lote_data):""}</span>
                  <span style={{fontSize:12,fontWeight:600,color:X.txt}}>{g.unidades.length}× {g.sku}</span>
                  {g.statusAloc==="confirmada"&&<span style={{fontSize:10,padding:"2px 6px",background:"#DCFCE7",color:X.grn,borderRadius:3,fontWeight:700}}>✅ Entregue</span>}
                  {g.statusAloc==="preliminar"&&<span style={{fontSize:10,padding:"2px 6px",background:"#DBEAFE",color:"#1E40AF",borderRadius:3,fontWeight:700}}>🔖 Reservada</span>}
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {g.unidades.map((u,j)=>u.unidadeId?
                    <span key={j} onClick={()=>{navigator.clipboard.writeText(u.unidadeId);show("📋 "+u.unidadeId);}} title="Clique para copiar" style={{fontFamily:mo,fontSize:10,padding:"3px 7px",background:"#1F293710",border:"1px solid #1F293720",borderRadius:3,cursor:"pointer",fontWeight:600,color:X.txt}}>{u.unidadeId}</span>
                    :<span key={j} style={{fontFamily:mo,fontSize:10,padding:"3px 7px",background:"#F3F4F6",border:"1px dashed #D1D5DB",borderRadius:3,color:X.mut,fontStyle:"italic"}}>un #{u.unidadeNoLote} (id gerando...)</span>
                  )}
                </div>
              </div>)}
              {gruposArr.length>1&&<p style={{margin:"0",fontSize:11,color:"#B45309"}}>⚡ Pedido consumiu de {gruposArr.length} lotes diferentes (FIFO — mais antigos primeiro)</p>}
            </div>;
          })()}
        </div>

        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <Btn onClick={()=>setModal(null)}>Fechar</Btn>
          <Btn primary onClick={()=>{setModal(null);openEditVenda(v);}}>✏️ Editar</Btn>
        </div>
      </Modal>;
    })()}

    {modal==="editVenda"&&editItem&&(()=>{
      const sub=(editItem.q40*9.90)+(editItem.q240*44.90)+(editItem.q500*84.90)+((editItem.qMel||0)*39.99);
      const totalCalc=sub+(+editItem.frete||0)-(+editItem.descontoValor||0);
      return<Modal title={`✏️ Editar ${editItem.id}`} onClose={()=>setModal(null)} wide>

        <FormSection title="Pedido" cols="1fr 1fr 1fr">
          <Inp label="Nº Pedido" value={editItem.id} onChange={v=>setEditItem({...editItem,id:v})} mono/>
          <Inp label="Data" type="date" value={editItem.data} onChange={v=>setEditItem({...editItem,data:v})}/>
          <Sel label="Tipo" value={editItem.tipo} onChange={v=>setEditItem({...editItem,tipo:v})} opts={["Venda","Amostra","Cortesia"]}/>
        </FormSection>

        <FormSection title="Cliente" cols="2fr 2fr 1fr">
          <Inp label="Nome" value={editItem.comp} onChange={v=>setEditItem({...editItem,comp:v})}/>
          <Inp label="Email" type="email" value={editItem._email||""} onChange={v=>setEditItem({...editItem,_email:v})}/>
          <Inp label="Telefone" value={editItem._tel||""} onChange={v=>setEditItem({...editItem,_tel:v})}/>
        </FormSection>

        <FormSection title="Endereço de entrega" cols="3fr 1fr 1fr">
          <Inp label="Rua / Logradouro" value={editItem._rua||""} onChange={v=>setEditItem({...editItem,_rua:v})}/>
          <Inp label="Número" value={editItem._num||""} onChange={v=>setEditItem({...editItem,_num:v})}/>
          <Inp label="Complemento" value={editItem._comp||""} onChange={v=>setEditItem({...editItem,_comp:v})}/>
        </FormSection>
        <FormSection title="" cols="2fr 2fr 1fr 1fr">
          <Inp label="Bairro" value={editItem._bairro||""} onChange={v=>setEditItem({...editItem,_bairro:v})}/>
          <Inp label="Cidade" value={editItem._cidade||"São Paulo"} onChange={v=>setEditItem({...editItem,_cidade:v})}/>
          <Inp label="UF" value={editItem._estado||"SP"} onChange={v=>setEditItem({...editItem,_estado:v.toUpperCase().slice(0,2)})}/>
          <Inp label="CEP" value={editItem._cep||""} onChange={v=>setEditItem({...editItem,_cep:v})}/>
        </FormSection>

        <FormSection title="Produtos & Frete" cols="1fr 1fr 1fr 1fr 1fr">
          <Inp label="Qtd 40g" type="number" value={editItem.q40} onChange={v=>setEditItem({...editItem,q40:+v})}/>
          <Inp label="Qtd 240g" type="number" value={editItem.q240} onChange={v=>setEditItem({...editItem,q240:+v})}/>
          <Inp label="Qtd 500g" type="number" value={editItem.q500} onChange={v=>setEditItem({...editItem,q500:+v})}/>
          <Inp label="🍯 Mel 300g" type="number" value={editItem.qMel||0} onChange={v=>setEditItem({...editItem,qMel:+v})}/>
          <Inp label="Frete" type="number" value={editItem.frete} onChange={v=>setEditItem({...editItem,frete:+v})} mono/>
        </FormSection>

        <FormSection title="Cupom & Pagamento" cols="1.2fr 1fr 1fr 1fr">
          <Sel label="Cupom" value={editItem.cupomCode||""} onChange={v=>{
            const c=cupons.find(x=>x.code===v);
            const desc=c?(c.tipo==="percentual"?(sub+(+editItem.frete||0))*(c.valor/100):c.valor):0;
            setEditItem({...editItem,cupomCode:v,descontoValor:desc||0});
          }} opts={["",...cupons.map(c=>c.code)]}/>
          <Inp label="Desconto" type="number" value={editItem.descontoValor||0} onChange={v=>setEditItem({...editItem,descontoValor:+v})} mono/>
          <Sel label="Pagamento" value={editItem.met} onChange={v=>setEditItem({...editItem,met:v})} opts={["Pix","Crédito","Débito","Dinheiro","Apple Pay","Cupom 100%","Amostra/Doação"]}/>
          <Sel label="Canal" value={editItem.canal} onChange={v=>setEditItem({...editItem,canal:v})} opts={["Presencial","Online","WhatsApp","Feira","Outro"]}/>
        </FormSection>

        <FormSection title="Valores" cols="1fr 1fr 1fr">
          <Inp label="Receita" type="number" value={editItem.rec} onChange={v=>setEditItem({...editItem,rec:+v})} mono/>
          <Inp label="Custo" type="number" value={editItem.custo} onChange={v=>setEditItem({...editItem,custo:+v})} mono/>
          <Inp label="Lucro" type="number" value={editItem.lucro} onChange={v=>setEditItem({...editItem,lucro:+v})} mono/>
        </FormSection>

        <FormSection title="Lote & Status" cols="1fr 1fr">
          <Sel label="Lote" value={editItem.lote||""} onChange={v=>setEditItem({...editItem,lote:v})} opts={["",...lotes.map(l=>l.id)]}/>
          <div style={{display:"flex",gap:16,paddingTop:20,flexWrap:"wrap"}}>
            <label style={{fontSize:13,display:"flex",alignItems:"center",gap:6}}><input type="checkbox" checked={editItem.prod} onChange={e=>setEditItem({...editItem,prod:e.target.checked})}/> ✅ Produzido</label>
            <label style={{fontSize:13,display:"flex",alignItems:"center",gap:6}}><input type="checkbox" checked={editItem.entreg} onChange={e=>setEditItem({...editItem,entreg:e.target.checked})}/> 🚚 Entregue</label>
            <label style={{fontSize:13,display:"flex",alignItems:"center",gap:6}}><input type="checkbox" checked={editItem.pago} onChange={e=>setEditItem({...editItem,pago:e.target.checked})}/> 💰 Pago</label>
          </div>
        </FormSection>

        <FormSection title="Observações" cols="1fr">
          <Inp label="" value={editItem.obs||""} onChange={v=>setEditItem({...editItem,obs:v})} ph="Notas internas"/>
        </FormSection>

        <div style={{padding:"14px 16px",background:X.accL,borderRadius:8,marginTop:8,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,fontFamily:mo,fontSize:13}}>
          <div><p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Subtotal</p><p style={{margin:"2px 0 0",fontWeight:700}}>{brl(sub)}</p></div>
          <div><p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Frete</p><p style={{margin:"2px 0 0",fontWeight:700}}>{brl(+editItem.frete||0)}</p></div>
          <div><p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Desconto</p><p style={{margin:"2px 0 0",fontWeight:700,color:X.red}}>-{brl(+editItem.descontoValor||0)}</p></div>
          <div><p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Total (receita)</p><p style={{margin:"2px 0 0",fontWeight:800,fontSize:16,color:X.acc}}>{brl(editItem.rec||totalCalc)}</p></div>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:20}}>
          <Btn danger onClick={()=>{if(confirm(`Excluir pedido ${editItem.id}?`)){deleteVenda(editItem.id);setModal(null);}}}>🗑 Excluir</Btn>
          <div style={{display:"flex",gap:10}}>
            <Btn onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn primary onClick={saveEditVenda}>💾 Salvar</Btn>
          </div>
        </div>
      </Modal>;
    })()}

    {modal==="novaVenda"&&novaVenda&&(()=>{
      const sub=(novaVenda.q40*9.90)+(novaVenda.q240*44.90)+(novaVenda.q500*84.90)+((novaVenda.qMel||0)*39.99);
      const totalCalc=sub+(+novaVenda.frete||0)-(+novaVenda.descontoValor||0);
      const hasProdutos=(novaVenda.q40+novaVenda.q240+novaVenda.q500+(novaVenda.qMel||0))>0;
      const canSave=novaVenda.id.trim()&&novaVenda.data&&novaVenda.tipo&&novaVenda.comp.trim()&&hasProdutos;
      return<Modal title="+ Nova Venda" onClose={()=>setModal(null)} wide>

        <FormSection title="🟢 Obrigatórios" cols="1fr 1fr 1fr" hint="Apenas estes campos são necessários">
          <Inp label="Nº Pedido *" value={novaVenda.id} onChange={v=>setNovaVenda({...novaVenda,id:v})} mono/>
          <Inp label="Data *" type="date" value={novaVenda.data} onChange={v=>setNovaVenda({...novaVenda,data:v})}/>
          <Sel label="Tipo *" value={novaVenda.tipo} onChange={v=>setNovaVenda({...novaVenda,tipo:v})} opts={["Venda","Amostra","Cortesia"]}/>
        </FormSection>

        <FormSection title="" cols="2fr 1fr 1fr 1fr 1fr" hint="">
          <Inp label="Cliente *" value={novaVenda.comp} onChange={v=>setNovaVenda({...novaVenda,comp:v})} ph="Nome do cliente"/>
          <Inp label="Qtd 40g" type="number" value={novaVenda.q40} onChange={v=>setNovaVenda({...novaVenda,q40:+v})}/>
          <Inp label="Qtd 240g" type="number" value={novaVenda.q240} onChange={v=>setNovaVenda({...novaVenda,q240:+v})}/>
          <Inp label="Qtd 500g" type="number" value={novaVenda.q500} onChange={v=>setNovaVenda({...novaVenda,q500:+v})}/>
          <Inp label="🍯 Mel 300g" type="number" value={novaVenda.qMel||0} onChange={v=>setNovaVenda({...novaVenda,qMel:+v})}/>
        </FormSection>

        <FormSection title="Contato (opcional)" cols="1fr 1fr">
          <Inp label="Email" type="email" value={novaVenda.email} onChange={v=>setNovaVenda({...novaVenda,email:v})} ph="cliente@email.com"/>
          <Inp label="Telefone" value={novaVenda.telefone} onChange={v=>setNovaVenda({...novaVenda,telefone:v})} ph="(11) 9..."/>
        </FormSection>

        <FormSection title="Endereço (opcional)" cols="3fr 1fr 1fr">
          <Inp label="Rua / Logradouro" value={novaVenda.rua} onChange={v=>setNovaVenda({...novaVenda,rua:v})} ph="Ex: Rua Ministro Godoi"/>
          <Inp label="Número" value={novaVenda.numero} onChange={v=>setNovaVenda({...novaVenda,numero:v})} ph="679"/>
          <Inp label="Complemento" value={novaVenda.complemento} onChange={v=>setNovaVenda({...novaVenda,complemento:v})} ph="Apto 102"/>
        </FormSection>
        <FormSection title="" cols="2fr 2fr 1fr 1fr">
          <Inp label="Bairro" value={novaVenda.bairro} onChange={v=>setNovaVenda({...novaVenda,bairro:v})} ph="Água Branca"/>
          <Inp label="Cidade" value={novaVenda.cidade} onChange={v=>setNovaVenda({...novaVenda,cidade:v})}/>
          <Inp label="UF" value={novaVenda.estado} onChange={v=>setNovaVenda({...novaVenda,estado:v.toUpperCase().slice(0,2)})}/>
          <Inp label="CEP" value={novaVenda.cep} onChange={v=>setNovaVenda({...novaVenda,cep:v})} ph="05015-000"/>
        </FormSection>

        <div style={{marginBottom:14,padding:"12px 14px",background:X.bg,borderRadius:8,border:`1px solid ${X.bdr}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <p style={{margin:0,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,color:X.mut}}>Frete (opcional)</p>
            <button onClick={calcularFretePorEndereco} disabled={calcFreteLoading} style={{padding:"6px 12px",borderRadius:6,border:`1px solid ${X.acc}`,background:calcFreteLoading?X.bdr:"#fff",color:X.acc,fontSize:11,fontWeight:600,cursor:calcFreteLoading?"wait":"pointer"}}>📍 {calcFreteLoading?"Calculando...":"Calcular pelo endereço"}</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Inp label="Valor do frete (R$)" type="number" value={novaVenda.frete} onChange={v=>setNovaVenda({...novaVenda,frete:+v})} mono/>
            <div style={{fontSize:11,color:X.mut,paddingTop:24,fontStyle:"italic"}}>Calcula pelo endereço ou edite manualmente</div>
          </div>
        </div>

        <FormSection title="Cupom & Pagamento (opcional)" cols="1.2fr 1fr 1fr 1fr">
          <Sel label="Cupom" value={novaVenda.cupomCode} onChange={v=>{
            const c=cupons.find(x=>x.code===v);
            setNovaVenda({...novaVenda,cupomCode:v,descontoValor:c?((c.tipo==="percentual"?(sub+(+novaVenda.frete||0))*(c.valor/100):c.valor)||0):0});
          }} opts={["",...cupons.filter(c=>c.ativo).map(c=>c.code)]}/>
          <Inp label="Desconto" type="number" value={novaVenda.descontoValor} onChange={v=>setNovaVenda({...novaVenda,descontoValor:+v})} mono/>
          <Sel label="Pagamento" value={novaVenda.met} onChange={v=>setNovaVenda({...novaVenda,met:v})} opts={["Pix","Crédito","Débito","Dinheiro","Apple Pay","Cupom 100%","Amostra/Doação"]}/>
          <Sel label="Canal" value={novaVenda.canal} onChange={v=>setNovaVenda({...novaVenda,canal:v})} opts={["Presencial","Online","WhatsApp","Feira","Outro"]}/>
        </FormSection>

        <div style={{marginBottom:14,padding:"12px 14px",background:X.bg,borderRadius:8,border:`1px solid ${X.bdr}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <p style={{margin:0,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,color:X.mut}}>Lote (opcional)</p>
            <label style={{fontSize:11,display:"flex",alignItems:"center",gap:6,color:X.mut,cursor:"pointer"}}>
              <input type="checkbox" checked={!!novaVenda.loteAuto} onChange={e=>setNovaVenda({...novaVenda,loteAuto:e.target.checked,lote:e.target.checked?"":novaVenda.lote})}/> Automático (FIFO)
            </label>
          </div>
          {novaVenda.loteAuto?
            <div style={{padding:"8px 12px",background:"#ECFDF5",borderRadius:6,border:"1px solid #A7F3D0",fontSize:11,color:"#065F46"}}>✓ Sistema escolherá o(s) lote(s) automaticamente via FIFO (mais antigos primeiro)</div>:
            <Sel label="Escolha o lote manualmente" value={novaVenda.lote} onChange={v=>setNovaVenda({...novaVenda,lote:v})} opts={["",...lotes.map(l=>l.id)]}/>
          }
        </div>

        <FormSection title="Receita & Status" cols="1fr 1fr">
          <Inp label="Receita (0 = auto)" type="number" value={novaVenda.rec} onChange={v=>setNovaVenda({...novaVenda,rec:+v})} mono/>
          <div style={{display:"flex",gap:16,paddingTop:20,flexWrap:"wrap"}}>
            <label style={{fontSize:13,display:"flex",alignItems:"center",gap:6,fontWeight:500}}><input type="checkbox" checked={novaVenda.prod} onChange={e=>setNovaVenda({...novaVenda,prod:e.target.checked})}/> ✅ Produzido</label>
            <label style={{fontSize:13,display:"flex",alignItems:"center",gap:6,fontWeight:500}}><input type="checkbox" checked={novaVenda.entreg} onChange={e=>setNovaVenda({...novaVenda,entreg:e.target.checked})}/> 🚚 Entregue</label>
            <label style={{fontSize:13,display:"flex",alignItems:"center",gap:6,fontWeight:500}}><input type="checkbox" checked={novaVenda.pago} onChange={e=>setNovaVenda({...novaVenda,pago:e.target.checked})}/> 💰 Pago</label>
          </div>
        </FormSection>

        <FormSection title="Observações (opcional)" cols="1fr">
          <Inp label="" value={novaVenda.obs} onChange={v=>setNovaVenda({...novaVenda,obs:v})} ph="Notas internas (ex: entregar até 18h, sem contato)"/>
        </FormSection>

        <div style={{padding:"14px 16px",background:X.accL,borderRadius:8,marginTop:8,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,fontFamily:mo,fontSize:13}}>
          <div><p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Subtotal</p><p style={{margin:"2px 0 0",fontWeight:700}}>{brl(sub)}</p></div>
          <div><p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Frete</p><p style={{margin:"2px 0 0",fontWeight:700}}>{brl(+novaVenda.frete||0)}</p></div>
          <div><p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Desconto</p><p style={{margin:"2px 0 0",fontWeight:700,color:X.red}}>-{brl(+novaVenda.descontoValor||0)}</p></div>
          <div><p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Total</p><p style={{margin:"2px 0 0",fontWeight:800,fontSize:16,color:X.acc}}>{brl(+novaVenda.rec>0?+novaVenda.rec:totalCalc)}</p></div>
        </div>

        {!canSave&&<p style={{fontSize:11,color:X.red,margin:"10px 0 0",fontWeight:600}}>⚠️ Preencha os campos marcados com * para salvar</p>}
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:16}}><Btn onClick={()=>setModal(null)}>Cancelar</Btn><Btn primary onClick={saveNovaVenda} disabled={!canSave}>Adicionar</Btn></div>
      </Modal>;
    })()}

    {modal==="detalhesIng"&&ingDetalhes&&(()=>{
      const i=ingDetalhes;
      const compras=ingCompras.filter(c=>c.ingrediente_nome===i.nome);
      const totalComprado=compras.reduce((s,c)=>s+parseFloat(c.kg||0),0);
      const totalGasto=compras.reduce((s,c)=>s+parseFloat(c.valor_total||c.kg*c.preco_kg||0),0);
      const precoMedio=totalComprado>0?totalGasto/totalComprado:i.precoKg;
      return<Modal title={`🧪 ${i.nome}`} onClose={()=>setModal(null)} wide>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:14}}>
          <div style={{padding:"12px 14px",background:X.bg,borderRadius:8}}>
            <p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Em estoque</p>
            <p style={{margin:"4px 0 0",fontSize:20,fontWeight:700,fontFamily:mo,color:i.est<3?X.red:X.grn}}>{i.est.toFixed(2)} kg</p>
          </div>
          <div style={{padding:"12px 14px",background:X.bg,borderRadius:8}}>
            <p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Total comprado</p>
            <p style={{margin:"4px 0 0",fontSize:20,fontWeight:700,fontFamily:mo}}>{totalComprado.toFixed(2)} kg</p>
          </div>
          <div style={{padding:"12px 14px",background:X.bg,borderRadius:8}}>
            <p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Preço médio</p>
            <p style={{margin:"4px 0 0",fontSize:20,fontWeight:700,fontFamily:mo,color:X.acc}}>{brl(precoMedio)}<span style={{fontSize:11,color:X.mut}}>/kg</span></p>
          </div>
          <div style={{padding:"12px 14px",background:X.bg,borderRadius:8}}>
            <p style={{margin:0,fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>Gasto total</p>
            <p style={{margin:"4px 0 0",fontSize:20,fontWeight:700,fontFamily:mo,color:X.acc}}>{brl(totalGasto)}</p>
          </div>
        </div>
        
        <h4 style={{margin:"0 0 10px",fontSize:12,fontWeight:700,color:X.mut,textTransform:"uppercase",letterSpacing:.5}}>📋 Histórico de compras ({compras.length})</h4>
        {compras.length===0?
          <p style={{margin:0,fontSize:12,color:X.mut,padding:"20px",textAlign:"center",background:X.bg,borderRadius:8}}>Nenhuma compra registrada</p>
          :<div style={{background:X.bg,borderRadius:8,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{background:X.card}}>
                <th style={th}>Data</th>
                <th style={th}>Kg</th>
                <th style={th}>R$/kg</th>
                <th style={th}>Total</th>
                <th style={th}>Fornecedor</th>
                <th style={th}>Pagador</th>
                <th style={{...th,width:40}}></th>
              </tr></thead>
              <tbody>
                {compras.map(c=><tr key={c.id} style={{borderTop:`1px solid ${X.bdr}`}}>
                  <td style={td_}>{fds(c.data)}</td>
                  <td style={{...td_,fontFamily:mo,fontWeight:600}}>{parseFloat(c.kg).toFixed(2)}</td>
                  <td style={{...td_,fontFamily:mo}}>{brl(c.preco_kg)}</td>
                  <td style={{...td_,fontFamily:mo,fontWeight:700,color:X.acc}}>{brl(c.valor_total||c.kg*c.preco_kg)}</td>
                  <td style={{...td_,fontSize:11,color:X.mut}}>{c.fornecedor||"—"}</td>
                  <td style={{...td_,fontSize:11}}>{c.pagador||"—"}</td>
                  <td style={td_}>
                    <button onClick={()=>deleteCompraIng(c)} title="Excluir compra" style={{background:"none",border:"none",cursor:"pointer",fontSize:12}}>🗑️</button>
                  </td>
                </tr>)}
              </tbody>
            </table>
          </div>
        }
        
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:16}}>
          <Btn onClick={()=>setModal(null)}>Fechar</Btn>
          <Btn primary onClick={()=>{setModal(null);openEditIng(i);}}>✏️ Editar valores</Btn>
        </div>
      </Modal>;
    })()}
    
    {modal==="editIng"&&ingEdit&&<Modal title={`✏️ Editar ${ingEdit.nome}`} onClose={()=>setModal(null)}>
      <FormSection title="Valores atuais" cols="1fr 1fr 1fr">
        <Inp label="Comprado (kg)" type="number" value={ingEdit.comprado} onChange={v=>setIngEdit({...ingEdit,comprado:v})} mono/>
        <Inp label="Preço médio (R$/kg)" type="number" value={ingEdit.precoKg} onChange={v=>setIngEdit({...ingEdit,precoKg:v})} mono/>
        <Inp label="Proporção na receita" type="number" value={ingEdit.prop} onChange={v=>setIngEdit({...ingEdit,prop:v})} mono/>
      </FormSection>
      <div style={{padding:"10px 12px",background:"#FEF3C7",borderRadius:8,marginBottom:14,border:"1px solid #F59E0B40"}}>
        <p style={{margin:0,fontSize:11,color:"#B45309"}}>⚠️ <strong>Atenção</strong>: editar manualmente aqui <u>sobrescreve</u> o total calculado pelas compras. Use só pra ajustes de inventário (ex: correção de perda, ajuste inicial). Pra adicionar estoque de uma compra real, use "+ Ingredientes".</p>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
        <Btn onClick={()=>setModal(null)}>Cancelar</Btn>
        <Btn primary onClick={saveEditIng}>💾 Salvar</Btn>
      </div>
    </Modal>}

    {modal==="editCompraIng"&&editCompraIng&&<Modal title={`✏️ Editar compra — ${editCompraIng.ingrediente_nome}`} onClose={()=>setModal(null)} wide>
      <div style={{padding:"10px 14px",background:"#FEF3C7",borderRadius:8,marginBottom:14,border:"1px solid #F59E0B40",fontSize:11,color:"#B45309"}}>
        ℹ️ Editar essa compra atualiza automaticamente: estoque do ingrediente (via trigger), custo nas DFs, e mês de classificação.
      </div>
      <FormSection title="Detalhes da compra" cols="1fr 1fr 1fr">
        <Inp label="Data" type="date" value={editCompraIng.data} onChange={v=>setEditCompraIng({...editCompraIng,data:v})}/>
        <Inp label="Kg comprados" type="number" value={editCompraIng.kg} onChange={v=>setEditCompraIng({...editCompraIng,kg:v})} mono/>
        <Inp label="Preço por kg (R$)" type="number" value={editCompraIng.preco_kg} onChange={v=>setEditCompraIng({...editCompraIng,preco_kg:v})} mono/>
      </FormSection>
      <FormSection title="Origem" cols="1fr 1fr">
        <Inp label="Fornecedor" value={editCompraIng.fornecedor} onChange={v=>setEditCompraIng({...editCompraIng,fornecedor:v})}/>
        <div>
          <label style={{display:"block",fontSize:11,color:X.mut,fontWeight:600,marginBottom:5,textTransform:"uppercase",letterSpacing:.4}}>Pagador</label>
          <select value={editCompraIng.pagador} onChange={e=>setEditCompraIng({...editCompraIng,pagador:e.target.value})} style={{width:"100%",padding:"9px 11px",borderRadius:6,border:`1px solid ${X.bdr}`,fontSize:13,background:"#fff"}}>
            <option value="Kroc">Kroc (caixa)</option>
            <option value="Caio">Caio</option>
            <option value="Felipe">Felipe</option>
            <option value="Leo">Leo</option>
          </select>
        </div>
      </FormSection>
      <FormSection title="Observações">
        <Inp label="Notas (opcional)" value={editCompraIng.observacoes} onChange={v=>setEditCompraIng({...editCompraIng,observacoes:v})}/>
      </FormSection>
      <div style={{padding:"10px 14px",background:X.bg,borderRadius:8,marginBottom:14,fontSize:12,fontFamily:mo,color:X.txt,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{color:X.mut}}>Valor total dessa compra:</span>
        <strong style={{color:X.acc,fontSize:14}}>{brl((parseFloat(editCompraIng.kg)||0)*(parseFloat(editCompraIng.preco_kg)||0))}</strong>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
        <Btn onClick={()=>setModal(null)}>Cancelar</Btn>
        <Btn primary onClick={saveEditCompraIng}>💾 Salvar</Btn>
      </div>
    </Modal>}

    {/* ═══ MODAL: NOVA COMPRA DE MEL ═══ */}
    {modal==="compraMel"&&novaCompraMel&&<Modal title="🍯 Nova Compra de Mel" onClose={()=>setModal(null)} wide>
      <div style={{padding:"12px 14px",background:"#FEF9C3",borderRadius:8,marginBottom:14,border:"1px solid #CA8A0440",fontSize:11,color:"#854D0E",lineHeight:1.5}}>
        ℹ️ Ao registrar a compra, o sistema cria automaticamente: um <strong>lote MEL-XXX</strong> no estoque, um custo na categoria <strong>"Revenda"</strong> nas DFs, e o pagamento associado ao pagador escolhido.
      </div>
      <FormSection title="Dados da compra" cols="1fr 1fr 1fr">
        <Inp label="Data" type="date" value={novaCompraMel.data} onChange={v=>setNovaCompraMel({...novaCompraMel,data:v})}/>
        <Inp label="Qtd de potes *" type="number" value={novaCompraMel.qtd_potes} onChange={v=>setNovaCompraMel({...novaCompraMel,qtd_potes:v})} ph="Ex: 24" mono/>
        <Inp label="Custo por pote (R$) *" type="number" value={novaCompraMel.custo_unit} onChange={v=>setNovaCompraMel({...novaCompraMel,custo_unit:v})} ph="Ex: 22.50" mono/>
      </FormSection>
      <FormSection title="Origem e validade" cols="1fr 1fr 1fr">
        <Inp label="Fornecedor" value={novaCompraMel.fornecedor} onChange={v=>setNovaCompraMel({...novaCompraMel,fornecedor:v})}/>
        <Inp label="Lote do fornecedor" value={novaCompraMel.lote_fornecedor} onChange={v=>setNovaCompraMel({...novaCompraMel,lote_fornecedor:v})} ph="Do rótulo do pote"/>
        <Inp label="Validade (do rótulo)" type="date" value={novaCompraMel.validade} onChange={v=>setNovaCompraMel({...novaCompraMel,validade:v})}/>
      </FormSection>
      <FormSection title="Pagamento" cols="1fr 2fr">
        <div>
          <label style={{display:"block",fontSize:11,color:X.mut,fontWeight:600,marginBottom:5,textTransform:"uppercase",letterSpacing:.4}}>Pagador</label>
          <select value={novaCompraMel.pagador} onChange={e=>setNovaCompraMel({...novaCompraMel,pagador:e.target.value})} style={{width:"100%",padding:"9px 11px",borderRadius:6,border:`1px solid ${X.bdr}`,fontSize:13,background:"#fff"}}>
            <option value="Kroc">Kroc (caixa)</option>
            <option value="Caio">Caio</option>
            <option value="Felipe">Felipe</option>
            <option value="Leo">Leo</option>
          </select>
        </div>
        <Inp label="Observações (opcional)" value={novaCompraMel.observacoes} onChange={v=>setNovaCompraMel({...novaCompraMel,observacoes:v})}/>
      </FormSection>
      <div style={{padding:"12px 16px",background:X.bg,borderRadius:8,marginBottom:14,fontSize:13,fontFamily:mo,color:X.txt,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{color:X.mut}}>Total da compra:</span>
        <strong style={{color:"#CA8A04",fontSize:16}}>{brl((parseFloat(novaCompraMel.qtd_potes)||0)*(parseFloat(novaCompraMel.custo_unit)||0))}</strong>
      </div>
      {!novaCompraMel.validade&&<p style={{fontSize:11,color:X.mut,fontStyle:"italic",margin:"0 0 10px"}}>💡 Validade não preenchida — sistema usa 12 meses a partir da data de compra</p>}
      <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
        <Btn onClick={()=>setModal(null)}>Cancelar</Btn>
        <Btn primary onClick={saveCompraMel}>🍯 Registrar Compra</Btn>
      </div>
    </Modal>}

    {/* ═══ MODAL: EDITAR COMPRA DE MEL ═══ */}
    {modal==="editCompraMel"&&editCompraMel&&<Modal title={`✏️ Editar Compra — ${editCompraMel.lote_id||"Mel"}`} onClose={()=>setModal(null)} wide>
      <div style={{padding:"10px 14px",background:"#FEF3C7",borderRadius:8,marginBottom:14,border:"1px solid #F59E0B40",fontSize:11,color:"#B45309"}}>
        ⚠️ Editar essa compra atualiza automaticamente: lote no estoque (qtd e data), custo nas DFs, e pagamento associado.
      </div>
      <FormSection title="Dados da compra" cols="1fr 1fr 1fr">
        <Inp label="Data" type="date" value={editCompraMel.data} onChange={v=>setEditCompraMel({...editCompraMel,data:v})}/>
        <Inp label="Qtd de potes" type="number" value={editCompraMel.qtd_potes} onChange={v=>setEditCompraMel({...editCompraMel,qtd_potes:v})} mono/>
        <Inp label="Custo por pote (R$)" type="number" value={editCompraMel.custo_unit} onChange={v=>setEditCompraMel({...editCompraMel,custo_unit:v})} mono/>
      </FormSection>
      <FormSection title="Origem e validade" cols="1fr 1fr 1fr">
        <Inp label="Fornecedor" value={editCompraMel.fornecedor} onChange={v=>setEditCompraMel({...editCompraMel,fornecedor:v})}/>
        <Inp label="Lote do fornecedor" value={editCompraMel.lote_fornecedor} onChange={v=>setEditCompraMel({...editCompraMel,lote_fornecedor:v})}/>
        <Inp label="Validade" type="date" value={editCompraMel.validade} onChange={v=>setEditCompraMel({...editCompraMel,validade:v})}/>
      </FormSection>
      <FormSection title="Pagamento" cols="1fr 2fr">
        <div>
          <label style={{display:"block",fontSize:11,color:X.mut,fontWeight:600,marginBottom:5,textTransform:"uppercase",letterSpacing:.4}}>Pagador</label>
          <select value={editCompraMel.pagador} onChange={e=>setEditCompraMel({...editCompraMel,pagador:e.target.value})} style={{width:"100%",padding:"9px 11px",borderRadius:6,border:`1px solid ${X.bdr}`,fontSize:13,background:"#fff"}}>
            <option value="Kroc">Kroc (caixa)</option>
            <option value="Caio">Caio</option>
            <option value="Felipe">Felipe</option>
            <option value="Leo">Leo</option>
          </select>
        </div>
        <Inp label="Observações" value={editCompraMel.observacoes} onChange={v=>setEditCompraMel({...editCompraMel,observacoes:v})}/>
      </FormSection>
      <div style={{padding:"12px 16px",background:X.bg,borderRadius:8,marginBottom:14,fontSize:13,fontFamily:mo,display:"flex",justifyContent:"space-between"}}>
        <span style={{color:X.mut}}>Total:</span>
        <strong style={{color:"#CA8A04",fontSize:16}}>{brl((parseFloat(editCompraMel.qtd_potes)||0)*(parseFloat(editCompraMel.custo_unit)||0))}</strong>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
        <Btn onClick={()=>setModal(null)}>Cancelar</Btn>
        <Btn primary onClick={saveEditCompraMel}>💾 Salvar</Btn>
      </div>
    </Modal>}

    {modal==="compra"&&compraIng&&<Modal title="🧪 Compra de Ingredientes" onClose={()=>setModal(null)} wide>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}><Inp label="Data" type="date" value={compraIng.data} onChange={v=>setCompraIng({...compraIng,data:v})}/><Inp label="Fornecedor" value={compraIng.forn} onChange={v=>setCompraIng({...compraIng,forn:v})} ph="Ex: Rei das Castanhas"/><Sel label="Pagador" value={compraIng.pag} onChange={v=>setCompraIng({...compraIng,pag:v})} opts={["Kroc","Caio","Leo","Felipe"]}/></div>
      {compraIng.itens.map((it,i)=><div key={it.nome} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8,alignItems:"end",marginBottom:6}}><p style={{margin:0,fontSize:13,fontWeight:600,padding:"10px 0"}}>{it.nome}</p><Inp label={i===0?"Kg":""} type="number" ph="0" value={it.kg} onChange={v=>{const n=[...compraIng.itens];n[i]={...n[i],kg:v};setCompraIng({...compraIng,itens:n})}}/><Inp label={i===0?"R$/Kg":""} type="number" value={it.preco} onChange={v=>{const n=[...compraIng.itens];n[i]={...n[i],preco:v};setCompraIng({...compraIng,itens:n})}} mono/><p style={{padding:"10px 0",fontFamily:mo,fontSize:13,fontWeight:600,color:X.acc}}>{+it.kg>0?brl(+it.kg* +it.preco):""}</p></div>)}
      <div style={{marginTop:12,padding:"12px 16px",background:X.accL,borderRadius:8,display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:600}}>Total</span><span style={{fontSize:18,fontWeight:700,fontFamily:mo,color:X.acc}}>{brl(compraIng.itens.reduce((s,i)=>s+(+i.kg||0)*(+i.preco||0),0))}</span></div>
      <p style={{fontSize:11,color:X.mut,margin:"8px 0 0"}}>✓ Atualiza estoque + custos + preço/kg automaticamente</p>
      <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:16}}><Btn onClick={()=>setModal(null)}>Cancelar</Btn><Btn primary onClick={saveCompra}>Registrar</Btn></div>
    </Modal>}

    {modal==="lote"&&novoLote&&<Modal title="🏭 Novo Lote" onClose={()=>setModal(null)}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Inp label="Nº Lote" value={novoLote.id} onChange={v=>setNovoLote({...novoLote,id:v})} mono/><Inp label="Data Produção" type="date" value={novoLote.data} onChange={v=>setNovoLote({...novoLote,data:v})}/></div>
      <p style={{fontSize:12,fontWeight:700,color:X.txt,margin:"8px 0 6px"}}>Quantos pacotes foram feitos?</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        <Inp label="Pacotes 40g" type="number" value={novoLote.p40} onChange={v=>setNovoLote({...novoLote,p40:v})}/>
        <Inp label="Pacotes 240g" type="number" value={novoLote.p240} onChange={v=>setNovoLote({...novoLote,p240:v})}/>
        <Inp label="Pacotes 500g" type="number" value={novoLote.p500} onChange={v=>setNovoLote({...novoLote,p500:v})}/>
      </div>
      <Inp label="Sobra bruta (kg)" type="number" value={novoLote.sobra} onChange={v=>setNovoLote({...novoLote,sobra:v})} ph="Kg que sobrou sem empacotar"/>
      <div style={{padding:"12px 16px",background:X.accL,borderRadius:8,marginTop:4}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
          <span style={{color:X.mut}}>Cálculo: ({novoLote.p40||0}×40g) + ({novoLote.p240||0}×240g) + ({novoLote.p500||0}×500g) + {novoLote.sobra||0}kg sobra</span>
        </div>
        <p style={{margin:"6px 0 0",fontSize:22,fontWeight:800,fontFamily:mo,color:X.acc}}>{calcKgLote(novoLote.p40,novoLote.p240,novoLote.p500,novoLote.sobra).toFixed(2)} kg total</p>
      </div>
      <p style={{fontSize:11,color:X.mut,margin:"8px 0 0"}}>Validade: {novoLote.data?fdt(new Date(new Date(novoLote.data).getTime()+45*864e5).toISOString()):"—"} (+45d) — ✓ Consome matéria-prima automaticamente</p>
      <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:16}}><Btn onClick={()=>setModal(null)}>Cancelar</Btn><Btn primary onClick={saveLote}>Registrar</Btn></div>
    </Modal>}

    {modal==="editLote"&&editLote&&<Modal title={`✏️ Editar ${editLote.id}`} onClose={()=>setModal(null)}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Inp label="Nº Lote" value={editLote.id} onChange={v=>setEditLote({...editLote,id:v})} mono/><Inp label="Data Produção" type="date" value={editLote.data} onChange={v=>setEditLote({...editLote,data:v})}/></div>
      <p style={{fontSize:12,fontWeight:700,color:X.txt,margin:"8px 0 6px"}}>Quantos pacotes foram feitos?</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        <Inp label="Pacotes 40g" type="number" value={editLote.p40} onChange={v=>setEditLote({...editLote,p40:v})}/>
        <Inp label="Pacotes 240g" type="number" value={editLote.p240} onChange={v=>setEditLote({...editLote,p240:v})}/>
        <Inp label="Pacotes 500g" type="number" value={editLote.p500} onChange={v=>setEditLote({...editLote,p500:v})}/>
      </div>
      <Inp label="Sobra bruta (kg)" type="number" value={editLote.sobra} onChange={v=>setEditLote({...editLote,sobra:v})} ph="Kg que sobrou sem empacotar"/>
      <div style={{padding:"12px 16px",background:X.accL,borderRadius:8,marginTop:4}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
          <span style={{color:X.mut}}>Cálculo: ({editLote.p40||0}×40g) + ({editLote.p240||0}×240g) + ({editLote.p500||0}×500g) + {editLote.sobra||0}kg sobra</span>
        </div>
        <p style={{margin:"6px 0 0",fontSize:22,fontWeight:800,fontFamily:mo,color:X.acc}}>{calcKgLote(editLote.p40,editLote.p240,editLote.p500,editLote.sobra).toFixed(2)} kg total</p>
      </div>
      <p style={{fontSize:11,color:X.mut,margin:"8px 0 0"}}>Validade: {editLote.data?fdt(new Date(new Date(editLote.data).getTime()+45*864e5).toISOString()):"—"} (+45d)</p>
      <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:16}}><Btn onClick={()=>setModal(null)}>Cancelar</Btn><Btn danger onClick={()=>{deleteLote(editLote.id);setModal(null)}}>Excluir</Btn><Btn primary onClick={saveEditLote}>Salvar</Btn></div>
    </Modal>}

    {modal==="emb"&&compraEmb&&<Modal title="📎 Compra de Embalagens" onClose={()=>setModal(null)} wide>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}><Inp label="Data" type="date" value={compraEmb.data} onChange={v=>setCompraEmb({...compraEmb,data:v})}/><Inp label="Fornecedor" value={compraEmb.forn} onChange={v=>setCompraEmb({...compraEmb,forn:v})}/><Sel label="Pagador" value={compraEmb.pag} onChange={v=>setCompraEmb({...compraEmb,pag:v})} opts={["Kroc","Caio","Leo","Felipe"]}/></div>
      <p style={{fontSize:12,fontWeight:600,color:X.mut,margin:"0 0 8px"}}>Quantidade e preço unitário por item (custo médio ponderado é atualizado)</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr",gap:6}}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8,padding:"4px 8px",fontSize:10,color:X.mut,fontWeight:700,textTransform:"uppercase"}}>
          <span>Item</span><span>Qtd</span><span>Preço/un</span><span>Subtotal</span>
        </div>
        {compraEmb.itens.map((it,i)=>{
          const subtotal=(+it.qtd||0)*(+it.preco||0);
          return<div key={it.nome} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8,alignItems:"center"}}>
            <span style={{fontSize:13}}>{it.nome}</span>
            <input type="number" placeholder="0" value={it.qtd} onChange={e=>{const n=[...compraEmb.itens];n[i]={...n[i],qtd:e.target.value};setCompraEmb({...compraEmb,itens:n})}} style={{padding:"8px",fontSize:13,border:`1px solid ${X.bdr}`,borderRadius:6,fontFamily:mo,background:X.bg}}/>
            <input type="number" step="0.01" placeholder="0.00" value={it.preco} onChange={e=>{const n=[...compraEmb.itens];n[i]={...n[i],preco:e.target.value};setCompraEmb({...compraEmb,itens:n})}} style={{padding:"8px",fontSize:13,border:`1px solid ${X.bdr}`,borderRadius:6,fontFamily:mo,background:X.bg}}/>
            <span style={{fontSize:13,fontFamily:mo,color:subtotal>0?X.acc:X.mut,fontWeight:600,textAlign:"right",paddingRight:8}}>{brl(subtotal)}</span>
          </div>;
        })}
      </div>
      <div style={{marginTop:12,padding:"12px 16px",background:X.accL,borderRadius:8,display:"flex",justifyContent:"space-between"}}>
        <span style={{fontWeight:600}}>Total Compra</span>
        <span style={{fontSize:18,fontWeight:700,fontFamily:mo,color:X.acc}}>{brl(compraEmb.itens.reduce((s,i)=>s+(+i.qtd||0)*(+i.preco||0),0))}</span>
      </div>
      <p style={{fontSize:11,color:X.mut,margin:"8px 0 0"}}>✓ Atualiza estoque + custos + preço médio ponderado automaticamente</p>
      <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:16}}><Btn onClick={()=>setModal(null)}>Cancelar</Btn><Btn primary onClick={saveEmb}>Registrar</Btn></div>
    </Modal>}

    {modal==="editEmb"&&editEmb&&<Modal title={`📎 Editar ${editEmb.nome}`} onClose={()=>setModal(null)}>
      <Inp label="Total Comprado" type="number" value={editEmb.comprado} onChange={v=>setEditEmb({...editEmb,comprado:v})} mono/>
      <Inp label="Total Utilizado (manual — normalmente auto-calculado)" type="number" value={editEmb.usado} onChange={v=>setEditEmb({...editEmb,usado:v})} mono/>
      <Inp label="Preço Médio (R$/un)" type="number" value={editEmb.precoMedio} onChange={v=>setEditEmb({...editEmb,precoMedio:v})} mono ph="0.00"/>
      <p style={{fontSize:11,color:X.mut,margin:"8px 0 0"}}>⚠️ O "Utilizado" é normalmente calculado a partir das vendas/baixas. Só edite se precisar corrigir manualmente.</p>
      <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:16}}><Btn onClick={()=>setModal(null)}>Cancelar</Btn><Btn primary onClick={saveEditEmb}>Salvar</Btn></div>
    </Modal>}

    {modal==="baixa"&&novaBaixa&&<Modal title="📉 Nova Baixa de Estoque" onClose={()=>setModal(null)} wide>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Inp label="Data" type="date" value={novaBaixa.data} onChange={v=>setNovaBaixa({...novaBaixa,data:v})}/>
        <Sel label="Categoria" value={novaBaixa.cat} onChange={v=>setNovaBaixa({...novaBaixa,cat:v})} opts={["Amostra","Marketing","Cortesia","Degradação","Perda","Outros"]}/>
      </div>
      <Inp label="Motivo" value={novaBaixa.motivo} onChange={v=>setNovaBaixa({...novaBaixa,motivo:v})} ph="Ex: Degustação feira, amostra cliente X"/>
      <Inp label="Destinatário (opcional)" value={novaBaixa.destin} onChange={v=>setNovaBaixa({...novaBaixa,destin:v})} ph="Nome / empresa / canal"/>
      <Inp label="Descrição (opcional)" value={novaBaixa.desc} onChange={v=>setNovaBaixa({...novaBaixa,desc:v})}/>
      <p style={{fontSize:12,fontWeight:700,color:X.txt,margin:"10px 0 4px"}}>Quantidade a descontar do estoque:</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12}}>
        <Inp label="40g" type="number" value={novaBaixa.q40} onChange={v=>setNovaBaixa({...novaBaixa,q40:+v})} mono/>
        <Inp label="240g" type="number" value={novaBaixa.q240} onChange={v=>setNovaBaixa({...novaBaixa,q240:+v})} mono/>
        <Inp label="500g" type="number" value={novaBaixa.q500} onChange={v=>setNovaBaixa({...novaBaixa,q500:+v})} mono/>
        <Inp label="🍯 Mel 300g" type="number" value={novaBaixa.qMel||0} onChange={v=>setNovaBaixa({...novaBaixa,qMel:+v})} mono/>
      </div>
      {(()=>{
        const tot=(+novaBaixa.q40)+(+novaBaixa.q240)+(+novaBaixa.q500)+(+novaBaixa.qMel||0);
        const custoMelAtual=prodCusto.find(p=>p.sku==="MEL-300")?.custoTotal||25;
        const custo=(+novaBaixa.q40)*4.34+(+novaBaixa.q240)*16.64+(+novaBaixa.q500)*34.41+(+novaBaixa.qMel||0)*custoMelAtual;
        if(tot===0)return null;
        return<div style={{marginTop:12,padding:"12px 16px",background:"#FEF3C7",borderRadius:8,display:"flex",justifyContent:"space-between"}}>
          <span style={{fontWeight:600,color:"#B45309"}}>{tot} unidades • Custo estimado</span>
          <span style={{fontSize:18,fontWeight:700,fontFamily:mo,color:"#B45309"}}>{brl(custo)}</span>
        </div>;
      })()}
      <p style={{fontSize:11,color:X.mut,margin:"8px 0 0"}}>✓ Desconta automaticamente do lote mais antigo (FIFO) + atualiza consumo de embalagens</p>
      <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:16}}><Btn onClick={()=>setModal(null)}>Cancelar</Btn><Btn primary onClick={saveBaixa}>Registrar Baixa</Btn></div>
    </Modal>}

    {modal==="custo"&&novoCusto&&(()=>{
      const val=+novoCusto.valor||0;
      const soma=(novoCusto.pagadores||[]).reduce((s,p)=>s+(+p.valorPago||0),0);
      const diff=Math.abs(soma-val);
      const addPag=()=>setNovoCusto(c=>({...c,pagadores:[...(c.pagadores||[]),{pagador:"Kroc",valorPago:"",reembPendente:""}]}));
      const rmPag=(i)=>setNovoCusto(c=>({...c,pagadores:c.pagadores.filter((_,idx)=>idx!==i)}));
      const upPag=(i,k,v)=>setNovoCusto(c=>({...c,pagadores:c.pagadores.map((p,idx)=>{
        if(idx!==i)return p;
        const np={...p,[k]:v};
        // Se mudou valorPago e pagador não é Kroc, sugere reembPendente = valorPago
        if(k==="valorPago"&&np.pagador!=="Kroc"&&!p._reembManual)np.reembPendente=v;
        // Se mudou pagador pra Kroc, zera reembPendente
        if(k==="pagador"&&v==="Kroc")np.reembPendente="0";
        return np;
      })}));
      return<Modal title="💸 Nova Despesa" onClose={()=>setModal(null)} wide>
        <Inp label="Data" type="date" value={novoCusto.data} onChange={v=>setNovoCusto({...novoCusto,data:v})}/>
        <Inp label="Despesa" value={novoCusto.desp} onChange={v=>setNovoCusto({...novoCusto,desp:v})} ph="Ex: Anúncio Instagram"/>
        <Inp label="Descrição" value={novoCusto.desc} onChange={v=>setNovoCusto({...novoCusto,desc:v})}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Inp label="Fornecedor" value={novoCusto.forn} onChange={v=>setNovoCusto({...novoCusto,forn:v})}/><Sel label="Categoria" value={novoCusto.cat} onChange={v=>setNovoCusto({...novoCusto,cat:v})} opts={["Matéria-prima","Embalagem","Frete","Feira/Eventos","Marketing","Software/SaaS","Impostos","Outros"]}/></div>
        <Inp label="Valor total da despesa" type="number" value={novoCusto.valor} onChange={v=>setNovoCusto({...novoCusto,valor:v})} mono/>
        
        {/* Pagadores (multi) */}
        <div style={{marginTop:14,padding:"14px",background:X.bg,borderRadius:8,border:`1px solid ${X.bdr}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div>
              <p style={{margin:0,fontSize:12,fontWeight:700,textTransform:"uppercase",color:X.mut}}>👥 Pagadores</p>
              <p style={{margin:"2px 0 0",fontSize:11,color:X.mut}}>Quem pagou quanto e quanto ainda deve ser reembolsado</p>
            </div>
            <Btn small onClick={addPag}>+ Adicionar</Btn>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:`1px solid ${X.bdr}`}}>
              <th style={{padding:"6px 8px",textAlign:"left",fontSize:10,color:X.mut,fontWeight:700}}>PESSOA</th>
              <th style={{padding:"6px 8px",textAlign:"right",fontSize:10,color:X.mut,fontWeight:700}}>VALOR PAGO</th>
              <th style={{padding:"6px 8px",textAlign:"right",fontSize:10,color:X.mut,fontWeight:700}}>REEMB PENDENTE</th>
              <th style={{padding:"6px 8px",width:40}}></th>
            </tr></thead>
            <tbody>
              {(novoCusto.pagadores||[]).map((p,i)=><tr key={i} style={{borderBottom:`1px solid ${X.bdr}`}}>
                <td style={{padding:"6px 8px"}}><select value={p.pagador} onChange={e=>upPag(i,"pagador",e.target.value)} style={{width:"100%",padding:"6px 8px",border:`1px solid ${X.bdr}`,borderRadius:4,fontSize:12}}>{["Kroc","Caio","Leo","Felipe"].map(o=><option key={o} value={o}>{o}</option>)}</select></td>
                <td style={{padding:"6px 8px"}}><input type="number" step="0.01" value={p.valorPago} onChange={e=>upPag(i,"valorPago",e.target.value)} style={{width:"100%",padding:"6px 8px",border:`1px solid ${X.bdr}`,borderRadius:4,fontSize:12,fontFamily:mo,textAlign:"right"}}/></td>
                <td style={{padding:"6px 8px"}}><input type="number" step="0.01" value={p.reembPendente} onChange={e=>upPag(i,"reembPendente",e.target.value)} disabled={p.pagador==="Kroc"} style={{width:"100%",padding:"6px 8px",border:`1px solid ${X.bdr}`,borderRadius:4,fontSize:12,fontFamily:mo,textAlign:"right",background:p.pagador==="Kroc"?"#F3F4F6":"#fff"}}/></td>
                <td style={{padding:"6px 8px",textAlign:"center"}}>{(novoCusto.pagadores||[]).length>1&&<button onClick={()=>rmPag(i)} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:X.red}}>🗑️</button>}</td>
              </tr>)}
            </tbody>
          </table>
          <div style={{marginTop:8,padding:"8px 10px",background:diff>0.01?"#FEF3C7":"#DCFCE7",borderRadius:6,fontSize:11,fontFamily:mo}}>
            {diff>0.01?<span style={{color:"#B45309",fontWeight:700}}>⚠️ Soma {brl(soma)} ≠ Valor {brl(val)} (diferença {brl(diff)})</span>:<span style={{color:"#065F46",fontWeight:700}}>✓ Soma {brl(soma)} = Valor {brl(val)}</span>}
          </div>
        </div>

        <label style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:novoCusto.recorrente?"#FEF3C7":X.bg,border:`2px solid ${novoCusto.recorrente?"#F59E0B":X.bdr}`,borderRadius:8,cursor:"pointer",marginTop:12}}>
          <input type="checkbox" checked={!!novoCusto.recorrente} onChange={e=>setNovoCusto({...novoCusto,recorrente:e.target.checked})} style={{width:18,height:18,cursor:"pointer"}}/>
          <div style={{flex:1}}>
            <p style={{margin:0,fontSize:13,fontWeight:700,color:novoCusto.recorrente?"#B45309":X.txt}}>🔁 Custo Fixo Recorrente (mensal)</p>
            <p style={{margin:"2px 0 0",fontSize:11,color:X.mut}}>Entra no cálculo de custos fixos mensais (R$ {novoCusto.valor||"0"}/mês)</p>
          </div>
        </label>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:16}}><Btn onClick={()=>setModal(null)}>Cancelar</Btn><Btn primary onClick={saveCusto}>Registrar</Btn></div>
      </Modal>;
    })()}

    {modal==="editCusto"&&editCusto&&(()=>{
      const val=+editCusto.valor||0;
      const soma=(editCusto.pagadores||[]).reduce((s,p)=>s+(+p.valorPago||0),0);
      const diff=Math.abs(soma-val);
      const totalQuit=(editCusto.pagadores||[]).reduce((s,p)=>s+(+p.reembQuitado||0),0);
      const addPag=()=>setEditCusto(c=>({...c,pagadores:[...(c.pagadores||[]),{pagador:"Kroc",valorPago:"",reembPendente:"",reembQuitado:0}]}));
      const rmPag=(i)=>setEditCusto(c=>({...c,pagadores:c.pagadores.filter((_,idx)=>idx!==i)}));
      const upPag=(i,k,v)=>setEditCusto(c=>({...c,pagadores:c.pagadores.map((p,idx)=>{
        if(idx!==i)return p;
        const np={...p,[k]:v};
        if(k==="pagador"&&v==="Kroc")np.reembPendente="0";
        return np;
      })}));
      return<Modal title="✏️ Editar Despesa" onClose={()=>setModal(null)} wide>
        <Inp label="Data" type="date" value={editCusto.data} onChange={v=>setEditCusto({...editCusto,data:v})}/>
        <Inp label="Despesa" value={editCusto.desp} onChange={v=>setEditCusto({...editCusto,desp:v})}/>
        <Inp label="Descrição" value={editCusto.desc||""} onChange={v=>setEditCusto({...editCusto,desc:v})}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Inp label="Fornecedor" value={editCusto.forn||""} onChange={v=>setEditCusto({...editCusto,forn:v})}/><Sel label="Categoria" value={editCusto.cat} onChange={v=>setEditCusto({...editCusto,cat:v})} opts={["Matéria-prima","Embalagem","Frete","Feira/Eventos","Marketing","Software/SaaS","Impostos","Outros"]}/></div>
        <Inp label="Valor total da despesa" type="number" value={editCusto.valor} onChange={v=>setEditCusto({...editCusto,valor:v})} mono/>
        
        <div style={{marginTop:14,padding:"14px",background:X.bg,borderRadius:8,border:`1px solid ${X.bdr}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div>
              <p style={{margin:0,fontSize:12,fontWeight:700,textTransform:"uppercase",color:X.mut}}>👥 Pagadores</p>
              {totalQuit>0&&<p style={{margin:"2px 0 0",fontSize:11,color:X.grn,fontWeight:600}}>✅ {brl(totalQuit)} já foi quitado (não-editável)</p>}
            </div>
            <Btn small onClick={addPag}>+ Adicionar</Btn>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:`1px solid ${X.bdr}`}}>
              <th style={{padding:"6px 8px",textAlign:"left",fontSize:10,color:X.mut,fontWeight:700}}>PESSOA</th>
              <th style={{padding:"6px 8px",textAlign:"right",fontSize:10,color:X.mut,fontWeight:700}}>VALOR PAGO</th>
              <th style={{padding:"6px 8px",textAlign:"right",fontSize:10,color:X.mut,fontWeight:700}}>REEMB PENDENTE</th>
              <th style={{padding:"6px 8px",textAlign:"right",fontSize:10,color:X.mut,fontWeight:700}}>QUITADO</th>
              <th style={{padding:"6px 8px",width:40}}></th>
            </tr></thead>
            <tbody>
              {(editCusto.pagadores||[]).map((p,i)=><tr key={i} style={{borderBottom:`1px solid ${X.bdr}`}}>
                <td style={{padding:"6px 8px"}}><select value={p.pagador} onChange={e=>upPag(i,"pagador",e.target.value)} style={{width:"100%",padding:"6px 8px",border:`1px solid ${X.bdr}`,borderRadius:4,fontSize:12}}>{["Kroc","Caio","Leo","Felipe"].map(o=><option key={o} value={o}>{o}</option>)}</select></td>
                <td style={{padding:"6px 8px"}}><input type="number" step="0.01" value={p.valorPago} onChange={e=>upPag(i,"valorPago",e.target.value)} style={{width:"100%",padding:"6px 8px",border:`1px solid ${X.bdr}`,borderRadius:4,fontSize:12,fontFamily:mo,textAlign:"right"}}/></td>
                <td style={{padding:"6px 8px"}}><input type="number" step="0.01" value={p.reembPendente} onChange={e=>upPag(i,"reembPendente",e.target.value)} disabled={p.pagador==="Kroc"} style={{width:"100%",padding:"6px 8px",border:`1px solid ${X.bdr}`,borderRadius:4,fontSize:12,fontFamily:mo,textAlign:"right",background:p.pagador==="Kroc"?"#F3F4F6":"#fff"}}/></td>
                <td style={{padding:"6px 8px",fontFamily:mo,fontSize:11,textAlign:"right",color:X.grn,fontWeight:600}}>{brl(+p.reembQuitado||0)}</td>
                <td style={{padding:"6px 8px",textAlign:"center"}}>{(editCusto.pagadores||[]).length>1&&<button onClick={()=>rmPag(i)} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:X.red}}>🗑️</button>}</td>
              </tr>)}
            </tbody>
          </table>
          <div style={{marginTop:8,padding:"8px 10px",background:diff>0.01?"#FEF3C7":"#DCFCE7",borderRadius:6,fontSize:11,fontFamily:mo}}>
            {diff>0.01?<span style={{color:"#B45309",fontWeight:700}}>⚠️ Soma {brl(soma)} ≠ Valor {brl(val)}</span>:<span style={{color:"#065F46",fontWeight:700}}>✓ Soma {brl(soma)} = Valor {brl(val)}</span>}
          </div>
        </div>

        <label style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:editCusto.recorrente?"#FEF3C7":X.bg,border:`2px solid ${editCusto.recorrente?"#F59E0B":X.bdr}`,borderRadius:8,cursor:"pointer",marginTop:12}}>
          <input type="checkbox" checked={!!editCusto.recorrente} onChange={e=>setEditCusto({...editCusto,recorrente:e.target.checked})} style={{width:18,height:18}}/>
          <p style={{margin:0,fontSize:13,fontWeight:700,color:editCusto.recorrente?"#B45309":X.txt}}>🔁 Custo Fixo Recorrente</p>
        </label>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:16}}><Btn onClick={()=>setModal(null)}>Cancelar</Btn><Btn primary onClick={saveEditCusto}>💾 Salvar</Btn></div>
      </Modal>;
    })()}

    {/* ═══ MODAIS CUPONS ═══ */}
    {modal==="novoCupom"&&novoCupom&&<Modal title="🎟️ Novo Cupom" onClose={()=>setModal(null)} wide>
      <Inp label="Código" value={novoCupom.code} onChange={v=>setNovoCupom({...novoCupom,code:v.toUpperCase()})} ph="Ex: KROC10" mono/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Sel label="Tipo" value={novoCupom.tipo} onChange={v=>setNovoCupom({...novoCupom,tipo:v})} opts={["percentual","fixo"]}/>
        <Inp label={novoCupom.tipo==="percentual"?"Desconto (%)":"Desconto (R$)"} type="number" value={novoCupom.valor} onChange={v=>setNovoCupom({...novoCupom,valor:v})} ph={novoCupom.tipo==="percentual"?"Ex: 10":"Ex: 20"}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Inp label="Validade (opcional)" type="date" value={novoCupom.validade} onChange={v=>setNovoCupom({...novoCupom,validade:v})}/>
        <Inp label="Uso máximo global (vazio=ilimitado)" type="number" value={novoCupom.uso_maximo} onChange={v=>setNovoCupom({...novoCupom,uso_maximo:v})} ph="Ex: 50"/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={{fontSize:12,fontWeight:600,color:X.mut,display:"block",marginBottom:6}}>Aplica em</label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[{v:"40g",l:"📦 40g"},{v:"240g",l:"📦 240g"},{v:"500g",l:"📦 500g"},{v:"mel",l:"🍯 Mel 300g"},{v:"frete",l:"🛵 Frete"}].map(opt=>{
            const arr=escopoToArr(novoCupom.escopo);
            const checked=arr.includes(opt.v);
            return <label key={opt.v} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",background:checked?X.accL:X.bg,borderRadius:8,border:`1px solid ${checked?X.acc:X.bdr}`,cursor:"pointer",fontSize:13,fontWeight:checked?600:400}}>
              <input type="checkbox" checked={checked} onChange={e=>{
                const next=e.target.checked?[...arr,opt.v]:arr.filter(x=>x!==opt.v);
                setNovoCupom({...novoCupom,escopo:next.length?next.join(","):"240g,500g"});
              }}/>
              {opt.l}
            </label>;
          })}
        </div>
      </div>

      {/* ─── Limite de unidades com desconto ─── */}
      <div style={{marginTop:16,padding:"14px 16px",background:"#FEF3C7",borderRadius:10,border:"2px solid #F59E0B30"}}>
        <p style={{margin:0,fontSize:13,fontWeight:700,color:"#B45309"}}>📏 Limite de unidades com desconto</p>
        <p style={{margin:"4px 0 10px",fontSize:11,color:X.mut}}>Apenas as N primeiras unidades recebem desconto; o resto vai preço cheio. Deixe vazio para aplicar em todas.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}}>
          <Inp label="40g (máx)" type="number" value={novoCupom.limite_40} onChange={v=>setNovoCupom({...novoCupom,limite_40:v})} ph="sem limite"/>
          <Inp label="240g (máx)" type="number" value={novoCupom.limite_240} onChange={v=>setNovoCupom({...novoCupom,limite_240:v})} ph="sem limite"/>
          <Inp label="500g (máx)" type="number" value={novoCupom.limite_500} onChange={v=>setNovoCupom({...novoCupom,limite_500:v})} ph="sem limite"/>
          <Inp label="Mel (máx)" type="number" value={novoCupom.limite_mel} onChange={v=>setNovoCupom({...novoCupom,limite_mel:v})} ph="sem limite"/>
        </div>
      </div>

      {/* ─── Restrição por cliente ─── */}
      <div style={{marginTop:12,padding:"14px 16px",background:"#DBEAFE",borderRadius:10,border:"2px solid #93C5FD"}}>
        <p style={{margin:0,fontSize:13,fontWeight:700,color:"#1E40AF"}}>👤 Restrição por cliente</p>
        <p style={{margin:"4px 0 10px",fontSize:11,color:X.mut}}>Apenas estes clientes podem usar o cupom. Email ou telefone — qualquer um autoriza. Deixe vazio para permitir qualquer cliente.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            <label style={{fontSize:11,color:X.mut,fontWeight:600,display:"block",marginBottom:4}}>Emails autorizados</label>
            <textarea value={novoCupom.restricao_emails} onChange={e=>setNovoCupom({...novoCupom,restricao_emails:e.target.value})} placeholder="a@x.com, b@y.com" rows={3} style={{width:"100%",padding:"8px 10px",fontSize:12,border:`1px solid ${X.bdr}`,borderRadius:6,fontFamily:mo,background:X.card,resize:"vertical",boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{fontSize:11,color:X.mut,fontWeight:600,display:"block",marginBottom:4}}>Telefones autorizados</label>
            <textarea value={novoCupom.restricao_telefones} onChange={e=>setNovoCupom({...novoCupom,restricao_telefones:e.target.value})} placeholder="11999998888, 11988887777" rows={3} style={{width:"100%",padding:"8px 10px",fontSize:12,border:`1px solid ${X.bdr}`,borderRadius:6,fontFamily:mo,background:X.card,resize:"vertical",boxSizing:"border-box"}}/>
          </div>
        </div>
      </div>

      {/* ─── Uso único por cliente ─── */}
      <label style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:novoCupom.uso_unico_por_cliente?"#F3E8FF":X.bg,border:`2px solid ${novoCupom.uso_unico_por_cliente?"#9333EA":X.bdr}`,borderRadius:8,cursor:"pointer",marginTop:12}}>
        <input type="checkbox" checked={!!novoCupom.uso_unico_por_cliente} onChange={e=>setNovoCupom({...novoCupom,uso_unico_por_cliente:e.target.checked})} style={{width:18,height:18,cursor:"pointer"}}/>
        <div style={{flex:1}}>
          <p style={{margin:0,fontSize:13,fontWeight:700,color:novoCupom.uso_unico_por_cliente?"#6B21A8":X.txt}}>🔒 Uso único por cliente</p>
          <p style={{margin:"2px 0 0",fontSize:11,color:X.mut}}>Cada cliente (identificado por email ou telefone) só pode usar este cupom 1x</p>
        </div>
      </label>

      <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:16}}><Btn onClick={()=>setModal(null)}>Cancelar</Btn><Btn primary onClick={saveCupom}>Criar Cupom</Btn></div>
    </Modal>}

    {modal==="editCupom"&&editCupom&&<Modal title={`✏️ Editar ${editCupom.code}`} onClose={()=>setModal(null)} wide>
      <Inp label="Código" value={editCupom.code} onChange={v=>setEditCupom({...editCupom,code:v.toUpperCase()})} mono/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Sel label="Tipo" value={editCupom.tipo} onChange={v=>setEditCupom({...editCupom,tipo:v})} opts={["percentual","fixo"]}/>
        <Inp label={editCupom.tipo==="percentual"?"Desconto (%)":"Desconto (R$)"} type="number" value={editCupom.valor} onChange={v=>setEditCupom({...editCupom,valor:v})}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Inp label="Validade" type="date" value={editCupom.validade} onChange={v=>setEditCupom({...editCupom,validade:v})}/>
        <Inp label="Uso máximo global (vazio=ilimitado)" type="number" value={editCupom.uso_maximo} onChange={v=>setEditCupom({...editCupom,uso_maximo:v})}/>
      </div>
      <p style={{fontSize:12,color:X.mut}}>Usos atuais: {editCupom.uso_atual||0}</p>
      <div style={{marginBottom:12}}>
        <label style={{fontSize:12,fontWeight:600,color:X.mut,display:"block",marginBottom:6}}>Aplica em</label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[{v:"40g",l:"📦 40g"},{v:"240g",l:"📦 240g"},{v:"500g",l:"📦 500g"},{v:"mel",l:"🍯 Mel 300g"},{v:"frete",l:"🛵 Frete"}].map(opt=>{
            const arr=escopoToArr(editCupom.escopo);
            const checked=arr.includes(opt.v);
            return <label key={opt.v} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",background:checked?X.accL:X.bg,borderRadius:8,border:`1px solid ${checked?X.acc:X.bdr}`,cursor:"pointer",fontSize:13,fontWeight:checked?600:400}}>
              <input type="checkbox" checked={checked} onChange={e=>{
                const next=e.target.checked?[...arr,opt.v]:arr.filter(x=>x!==opt.v);
                setEditCupom({...editCupom,escopo:next.length?next.join(","):"240g,500g"});
              }}/>
              {opt.l}
            </label>;
          })}
        </div>
      </div>

      {/* ─── Limite de unidades com desconto ─── */}
      <div style={{marginTop:16,padding:"14px 16px",background:"#FEF3C7",borderRadius:10,border:"2px solid #F59E0B30"}}>
        <p style={{margin:0,fontSize:13,fontWeight:700,color:"#B45309"}}>📏 Limite de unidades com desconto</p>
        <p style={{margin:"4px 0 10px",fontSize:11,color:X.mut}}>Apenas as N primeiras unidades recebem desconto; o resto vai preço cheio. Deixe vazio para aplicar em todas.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}}>
          <Inp label="40g (máx)" type="number" value={editCupom.limite_40} onChange={v=>setEditCupom({...editCupom,limite_40:v})} ph="sem limite"/>
          <Inp label="240g (máx)" type="number" value={editCupom.limite_240} onChange={v=>setEditCupom({...editCupom,limite_240:v})} ph="sem limite"/>
          <Inp label="500g (máx)" type="number" value={editCupom.limite_500} onChange={v=>setEditCupom({...editCupom,limite_500:v})} ph="sem limite"/>
          <Inp label="Mel (máx)" type="number" value={editCupom.limite_mel} onChange={v=>setEditCupom({...editCupom,limite_mel:v})} ph="sem limite"/>
        </div>
      </div>

      {/* ─── Restrição por cliente ─── */}
      <div style={{marginTop:12,padding:"14px 16px",background:"#DBEAFE",borderRadius:10,border:"2px solid #93C5FD"}}>
        <p style={{margin:0,fontSize:13,fontWeight:700,color:"#1E40AF"}}>👤 Restrição por cliente</p>
        <p style={{margin:"4px 0 10px",fontSize:11,color:X.mut}}>Apenas estes clientes podem usar o cupom. Email ou telefone — qualquer um autoriza. Deixe vazio para permitir qualquer cliente.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            <label style={{fontSize:11,color:X.mut,fontWeight:600,display:"block",marginBottom:4}}>Emails autorizados</label>
            <textarea value={editCupom.restricao_emails} onChange={e=>setEditCupom({...editCupom,restricao_emails:e.target.value})} placeholder="a@x.com, b@y.com" rows={3} style={{width:"100%",padding:"8px 10px",fontSize:12,border:`1px solid ${X.bdr}`,borderRadius:6,fontFamily:mo,background:X.card,resize:"vertical",boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{fontSize:11,color:X.mut,fontWeight:600,display:"block",marginBottom:4}}>Telefones autorizados</label>
            <textarea value={editCupom.restricao_telefones} onChange={e=>setEditCupom({...editCupom,restricao_telefones:e.target.value})} placeholder="11999998888, 11988887777" rows={3} style={{width:"100%",padding:"8px 10px",fontSize:12,border:`1px solid ${X.bdr}`,borderRadius:6,fontFamily:mo,background:X.card,resize:"vertical",boxSizing:"border-box"}}/>
          </div>
        </div>
      </div>

      {/* ─── Uso único por cliente ─── */}
      <label style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:editCupom.uso_unico_por_cliente?"#F3E8FF":X.bg,border:`2px solid ${editCupom.uso_unico_por_cliente?"#9333EA":X.bdr}`,borderRadius:8,cursor:"pointer",marginTop:12}}>
        <input type="checkbox" checked={!!editCupom.uso_unico_por_cliente} onChange={e=>setEditCupom({...editCupom,uso_unico_por_cliente:e.target.checked})} style={{width:18,height:18,cursor:"pointer"}}/>
        <div style={{flex:1}}>
          <p style={{margin:0,fontSize:13,fontWeight:700,color:editCupom.uso_unico_por_cliente?"#6B21A8":X.txt}}>🔒 Uso único por cliente</p>
          <p style={{margin:"2px 0 0",fontSize:11,color:X.mut}}>Cada cliente (identificado por email ou telefone) só pode usar este cupom 1x</p>
        </div>
      </label>

      <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:16}}><Btn onClick={()=>setModal(null)}>Cancelar</Btn><Btn danger onClick={()=>{deleteCupom(editCupom.id,editCupom.code);setModal(null)}}>Excluir</Btn><Btn primary onClick={saveEditCupom}>Salvar</Btn></div>
    </Modal>}

    {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",padding:"12px 24px",borderRadius:10,fontSize:14,fontWeight:500,background:X.grn,color:"#FFF",zIndex:300,boxShadow:"0 4px 20px rgba(0,0,0,0.15)",fontFamily:f}}>{toast}</div>}
  </div>;
}
