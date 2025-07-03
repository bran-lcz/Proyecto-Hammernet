import"./AdminLayout.astro_astro_type_script_index_0_lang.DLKx8HaD.js";document.addEventListener("DOMContentLoaded",()=>{const p=localStorage.getItem("isLoggedIn");if(!p||p!=="true"){window.location.href="/login";return}const l=document.createElement("script");l.src="https://cdn.jsdelivr.net/npm/chart.js",l.onload=y,document.head.appendChild(l);function y(){const w=document.getElementById("ventasTotales"),E=document.getElementById("totalPedidos"),I=document.getElementById("ticketPromedio"),M=document.getElementById("productosVendidos"),u=document.getElementById("tablaVentas"),i=document.getElementById("filtroMes"),C=document.getElementById("btnExportar"),S=document.getElementById("graficoVentas");let d=JSON.parse(localStorage.getItem("ventas"))||[];if(d.length===0){const a=new Date,e=JSON.parse(localStorage.getItem("productos"))||[];if(e.length>0){for(let t=0;t<20;t++){const c=Math.floor(Math.random()*180),o=new Date(a);o.setDate(o.getDate()-c);const n=Math.floor(Math.random()*3)+1,s=[];let f=0,x=0;for(let b=0;b<n;b++){const v=Math.floor(Math.random()*e.length),r=e[v],m=Math.floor(Math.random()*3)+1,$=r.precio*m;s.push({productoId:r.id,nombre:r.nombre,precio:r.precio,cantidad:m,subtotal:$}),f+=$,x+=m}d.push({id:t+1,cliente:`Cliente ${t+1}`,fecha:o.toISOString(),items:s,total:f,totalItems:x,estado:Math.random()>.2?"Completado":"Pendiente"})}localStorage.setItem("ventas",JSON.stringify(d))}}function h(a=d){const e=a.reduce((n,s)=>n+s.total,0),t=a.length,c=t>0?e/t:0,o=a.reduce((n,s)=>n+s.totalItems,0);w.textContent=`$${e.toFixed(2)}`,E.textContent=t,I.textContent=`$${c.toFixed(2)}`,M.textContent=o}function g(a=d){u.innerHTML="",[...a].sort((t,c)=>new Date(c.fecha)-new Date(t.fecha)).forEach(t=>{const c=new Date(t.fecha),o=document.createElement("tr");o.innerHTML=`
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#${t.id}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${t.cliente}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${c.toLocaleDateString()}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${t.totalItems} items</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">$${t.total.toFixed(2)}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${t.estado==="Completado"?"green":"yellow"}-100 text-${t.estado==="Completado"?"green":"yellow"}-800">
                                ${t.estado}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button data-id="${t.id}" class="btn-ver text-blue-600 hover:text-blue-900">Ver detalles</button>
                        </td>
                    `,u.appendChild(o)}),document.querySelectorAll(".btn-ver").forEach(t=>{t.addEventListener("click",c=>{const o=parseInt(c.target.dataset.id),n=d.find(s=>s.id===o);n&&alert(`Detalles del pedido #${n.id}:

Cliente: ${n.cliente}
Fecha: ${new Date(n.fecha).toLocaleDateString()}

Productos:
${n.items.map(s=>`- ${s.nombre} x${s.cantidad}: $${s.subtotal.toFixed(2)}`).join(`
`)}

Total: $${n.total.toFixed(2)}`)})})}function D(a=d){const e={},t=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];t.forEach((o,n)=>{e[n]=0}),a.forEach(o=>{const s=new Date(o.fecha).getMonth();e[s]+=o.total});const c=S.getContext("2d");new Chart(c,{type:"bar",data:{labels:t,datasets:[{label:"Ventas ($)",data:Object.values(e),backgroundColor:"rgba(59, 130, 246, 0.5)",borderColor:"rgba(59, 130, 246, 1)",borderWidth:1}]},options:{responsive:!0,maintainAspectRatio:!1,scales:{y:{beginAtZero:!0,ticks:{callback:function(o){return"$"+o}}}}}})}i.addEventListener("change",()=>{const a=i.value;let e=d;if(a!==""){const t=parseInt(a);e=d.filter(c=>new Date(c.fecha).getMonth()===t)}h(e),g(e)}),C.addEventListener("click",()=>{const a=i.value;let e="Reporte de Ventas - Todos los meses";if(a!==""){const t=parseInt(a);e=`Reporte de Ventas - ${meses[t]}`}alert(`Exportando ${e}...

Esta funcionalidad generaría un archivo CSV o Excel con los datos de ventas.`)}),h(),g(),D()}});
