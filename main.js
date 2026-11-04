// Каталог: новые товары и категории добавляются в этот массив.
// Стоимость, наличие и спецификации не публикуем до подтверждения руководителем.
const products = [
  {id:'blue-camo',name:'Синий камуфляж',color:'Сине-голубой камуфляж',image:'blue-camo.webp',swatch:'#3a648a',category:'backpack'},
  {id:'pink',name:'Розовый',color:'Розовый',image:'pink.webp',swatch:'#d87592',category:'backpack'},
  {id:'black-red',name:'Красно-чёрный',color:'Красно-чёрный',image:'black-red.webp',swatch:'linear-gradient(130deg,#dd252a 50%,#151515 50%)',category:'backpack'},
  {id:'grey',name:'Серый камуфляж',color:'Серый камуфляж',image:'grey.webp',swatch:'#70777b',category:'backpack'},
  {id:'red',name:'Красный',color:'Красный',image:'red.webp',swatch:'#e4262d',category:'backpack'},
  {id:'purple',name:'Фиолетовый',color:'Фиолетовый',image:'purple.webp',swatch:'#5b3a99',category:'backpack'},
  {id:'navy',name:'Тёмно-синий',color:'Тёмно-синий',image:'navy.webp',swatch:'#1f2d47',category:'backpack'},
  {id:'turquoise',name:'Бирюзовый',color:'Бирюзовый',image:'turquoise.webp',swatch:'#02a69e',category:'backpack'},
  {id:'yellow',name:'Жёлтый',color:'Жёлтый',image:'yellow.webp',swatch:'#ffc800',category:'backpack'}
];

const $ = (s)=>document.querySelector(s);
const grid = $('#productGrid');
const cartCount = $('#cartCount');
const drawerCount = $('#drawerCount');
const drawerItems = $('#drawerItems');
const drawer = $('#cartDrawer');
const modal = $('#productModal');
const overlay = $('#overlay');
const toast = $('#toast');
let toastTimer;
let currentProduct = null;
let activeLayer = null;
let previousFocus = null;
let cart = {};
try { cart = JSON.parse(localStorage.getItem('nikiforov-merch-cart')||'{}') || {}; } catch { cart = {}; }
const validIds = new Set(products.map(p=>p.id));
cart = Object.fromEntries(Object.entries(cart).filter(([id,qty])=>validIds.has(id)&&Number.isSafeInteger(qty)&&qty>0));

function showToast(message){
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>toast.classList.remove('show'),2700);
}
function saveCart(){
  try { localStorage.setItem('nikiforov-merch-cart',JSON.stringify(cart)); } catch {}
  renderCart();
}
function countItems(){return Object.values(cart).reduce((sum,qty)=>sum+qty,0);}
function productById(id){return products.find(p=>p.id===id);}

function renderProducts(category='all'){
  const shown = products.filter(p=>category==='all'||p.category===category);
  grid.innerHTML = shown.map(p=>`
    <article class="product-card">
      <div class="product-image-wrap" data-open="${p.id}" role="button" tabindex="0" aria-label="Посмотреть фото: ${p.name}">
        <img class="product-image" src="./assets/${p.image}" alt="Рюкзак NIKIFOROV, ${p.color.toLowerCase()}" loading="lazy" />
      </div>
      <div class="product-meta">
        <span class="product-name">${p.name}</span>
        <button class="product-add" type="button" data-add="${p.id}">В заявку</button>
      </div>
    </article>`).join('');
}

// Фильтры появляются только при добавлении других категорий.
const categoryLabels = {backpack:'Рюкзаки',clothing:'Одежда',accessory:'Аксессуары'};
const categories = [...new Set(products.map(p=>p.category))];
const filters = $('#categoryFilters');
if(categories.length>1){
  filters.hidden=false;
  filters.innerHTML = ['all',...categories].map((category,i)=>
    `<button type="button" data-category="${category}" class="${i===0?'is-active':''}">${category==='all'?'Все товары':categoryLabels[category]||category}</button>`
  ).join('');
  filters.addEventListener('click',(event)=>{
    const button=event.target.closest('[data-category]');
    if(!button)return;
    filters.querySelectorAll('button').forEach(b=>b.classList.toggle('is-active',b===button));
    renderProducts(button.dataset.category);
  });
}

function addToCart(id){
  if(!validIds.has(id))return;
  cart[id] = (cart[id]||0)+1;
  saveCart();
  showToast('Добавлено в вашу заявку');
}
function updateQty(id,delta){
  if(!validIds.has(id))return;
  const qty=(cart[id]||0)+delta;
  if(qty<=0) delete cart[id]; else cart[id]=Math.min(qty,99);
  saveCart();
}
function renderCart(){
  const count = countItems();
  $('#requestFallback').hidden=true;
  cartCount.textContent=count;
  drawerCount.textContent=`(${count})`;
  $('#copyRequest').disabled = count===0;
  $('#shareRequest').disabled = count===0;
  $('#clearCart').hidden = count===0;
  const items=products.filter(p=>cart[p.id]);
  if(!items.length){
    drawerItems.innerHTML='<div class="empty-cart"><h3>Пока пусто</h3><p>Выберите рюкзак в каталоге.</p></div>';
    return;
  }
  drawerItems.innerHTML=items.map(p=>`
    <div class="cart-line"><img src="./assets/${p.image}" alt="Рюкзак ${p.name}" />
      <div><div class="cart-line-title">Рюкзак NIKIFOROV</div><div class="cart-line-color">${p.color}</div><div class="qty-controls"><button type="button" data-qty="${p.id}" data-delta="-1" aria-label="Уменьшить количество">-</button><span>${cart[p.id]}</span><button type="button" data-qty="${p.id}" data-delta="1" aria-label="Увеличить количество">+</button></div></div>
      <button class="remove-line" type="button" data-remove="${p.id}" aria-label="Удалить ${p.name}">Удалить</button></div>`).join('');
}

function openLayer(name){
  previousFocus = document.activeElement;
  activeLayer = name;
  overlay.hidden=false;
  document.body.classList.add('no-scroll');
  if(name==='cart'){
    drawer.classList.add('is-open');drawer.setAttribute('aria-hidden','false');
    $('#closeCart').focus();
  } else {
    modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');
    $('#closeModal').focus();
  }
}
function closeLayer(){
  activeLayer=null;
  overlay.hidden=true;
  document.body.classList.remove('no-scroll');
  drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden','true');
  modal.classList.remove('is-open'); modal.setAttribute('aria-hidden','true');
  previousFocus?.focus?.();
}
function openProduct(id){
  const p=productById(id);if(!p)return;
  currentProduct=p;
  $('#modalTitle').textContent=`Рюкзак ${p.name}`;
  $('#modalColor').textContent=p.color;
  $('#modalImage').src=`./assets/${p.image}`;
  $('#modalImage').alt=`Рюкзак NIKIFOROV, ${p.color.toLowerCase()}`;
  openLayer('modal');
}

grid.addEventListener('click',(e)=>{
  const add=e.target.closest('[data-add]');
  if(add){e.stopPropagation();addToCart(add.dataset.add);return;}
  const open=e.target.closest('[data-open]');
  if(open){e.preventDefault();openProduct(open.dataset.open);}
});
grid.addEventListener('keydown',(e)=>{
  if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('product-image-wrap')){
    e.preventDefault();openProduct(e.target.dataset.open);
  }
});
$('#openCart').addEventListener('click',()=>openLayer('cart'));
$('#closeCart').addEventListener('click',closeLayer);
$('#closeModal').addEventListener('click',closeLayer);
overlay.addEventListener('click',closeLayer);
$('#modalAdd').addEventListener('click',()=>{if(currentProduct){addToCart(currentProduct.id);closeLayer();openLayer('cart');}});
drawerItems.addEventListener('click',(e)=>{
  const qty=e.target.closest('[data-qty]');
  const remove=e.target.closest('[data-remove]');
  if(qty)updateQty(qty.dataset.qty,Number(qty.dataset.delta));
  if(remove){delete cart[remove.dataset.remove];saveCart();}
});
$('#clearCart').addEventListener('click',()=>{cart={};saveCart();showToast('Список очищен');});
function makeRequestText(){
  if(!countItems())return null;
  const name=$('#requestName').value.trim();
  const contact=$('#requestContact').value.trim();
  const comment=$('#requestComment').value.trim();
  if(contact.length<3){
    showToast('Укажите телефон или Telegram для связи');
    $('#requestContact').focus();
    return null;
  }
  const lines=products.filter(p=>cart[p.id]).map((p,i)=>`${i+1}. Рюкзак NIKIFOROV — ${p.color}, ${cart[p.id]} шт.`);
  return `Заявка на мерч NIKIFOROV\n\n${lines.join('\n')}\n\n${name?`Имя: ${name}\n`:''}Контакт: ${contact}${comment?`\nКомментарий: ${comment}`:''}\n\nПрошу уточнить стоимость, наличие, доставку и порядок оплаты через менеджера.`;
}
$('#copyRequest').addEventListener('click',async()=>{
  const message=makeRequestText();
  if(!message)return;
  let copied=false;
  try { await navigator.clipboard.writeText(message); copied=true; } catch {}
  if(!copied){
    const field=$('#requestFallback');
    field.hidden=false;
    field.value=message;
    field.focus();field.select();
    try { copied=document.execCommand('copy'); } catch {}
    if(!copied){showToast('Текст выделен — нажмите Ctrl+C');return;}
    field.hidden=true;
  }
  showToast('Заявка скопирована');
  $('#copyRequest').textContent='Заявка скопирована';
  setTimeout(()=>$('#copyRequest').textContent='Скопировать заявку',2400);
});
if(typeof navigator.share==='function'){
  $('#shareRequest').hidden=false;
  $('#shareRequest').addEventListener('click',async()=>{
    const message=makeRequestText();
    if(!message)return;
    try{await navigator.share({title:'Заявка NIKIFOROV MERCH',text:message});}
    catch(e){if(e?.name!=='AbortError')showToast('Не удалось поделиться — скопируйте текст');}
  });
}
document.addEventListener('keydown',(e)=>{
  if(e.key==='Escape'&&activeLayer)closeLayer();
  if(e.key==='Tab'&&activeLayer){
    const layer=activeLayer==='cart'?drawer:modal;
    const els=[...layer.querySelectorAll('button,a,[tabindex]:not([tabindex="-1"])')].filter(x=>!x.disabled&&x.offsetParent!==null);
    if(!els.length)return;
    const first=els[0],last=els.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
});
renderProducts();renderCart();
