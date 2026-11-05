// Каталог: новые товары и категории добавляются в этот массив.
// Стоимость, наличие и спецификации не публикуем до подтверждения руководителем.
const products = [
  {id:'blue-camo',name:'Синий камуфляж',color:'Сине-голубой камуфляж',image:'blue-camo.webp',gallery:['blue-camo-2.webp','blue-camo-3.webp'],category:'backpack'},
  {id:'pink',name:'Розовый',color:'Розовый',image:'pink.webp',gallery:['pink-2.webp','pink-3.webp'],category:'backpack'},
  {id:'black-red',name:'Красно-чёрный',color:'Красно-чёрный',image:'black-red.webp',gallery:['black-red-2.webp','black-red-3.webp'],category:'backpack'},
  {id:'grey',name:'Серый камуфляж',color:'Серый камуфляж',image:'grey.webp',gallery:['grey-2.webp','grey-3.webp'],category:'backpack'},
  {id:'red',name:'Красный',color:'Красный',image:'red.webp',gallery:['red-2.webp','red-3.webp'],category:'backpack'},
  {id:'purple',name:'Фиолетовый',color:'Фиолетовый',image:'purple.webp',gallery:['purple-2.webp','purple-3.webp'],category:'backpack'},
  {id:'navy',name:'Тёмно-синий',color:'Тёмно-синий',image:'navy.webp',gallery:['navy-2.webp','navy-3.webp'],category:'backpack'},
  {id:'turquoise',name:'Бирюзовый',color:'Бирюзовый',image:'turquoise.webp',gallery:['turquoise-2.webp','turquoise-3.webp'],category:'backpack'},
  {id:'yellow',name:'Жёлтый',color:'Жёлтый',image:'yellow.webp',gallery:['yellow-2.webp','yellow-3.webp'],category:'backpack'}
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
let modalPhotoIndex = 0;
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
function photosFor(product){return [product.image,...(product.gallery||[])];}

function renderProducts(category='all'){
  const shown = products.filter(p=>category==='all'||p.category===category);
  grid.innerHTML = shown.map(p=>`
    <article class="product-card">
      <div class="product-image-frame" data-product="${p.id}">
        <button class="product-image-wrap" type="button" data-open="${p.id}" aria-label="Открыть фото: ${p.name}">
          <img class="product-image" data-card-image="${p.id}" src="./assets/${p.image}" alt="Рюкзак NIKIFOROV, ${p.color.toLowerCase()}" loading="lazy" />
        </button>
        <div class="photo-dots" role="group" aria-label="Фотографии: ${p.name}">
          ${photosFor(p).map((_,index)=>`<button class="photo-dot" type="button" data-photo="${p.id}" data-index="${index}" aria-label="Фото ${index+1} из ${photosFor(p).length}" aria-pressed="${index===0}"></button>`).join('')}
        </div>
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
function setCardPhoto(id,index){
  const product=productById(id);
  const frame=grid.querySelector(`[data-product="${id}"]`);
  if(!product||!frame)return;
  const photos=photosFor(product);
  const selected=(index+photos.length)%photos.length;
  frame.dataset.activeIndex=String(selected);
  const img=frame.querySelector('.product-image');
  img.src=`./assets/${photos[selected]}`;
  img.alt=`NIKIFOROV ${product.name}, фото ${selected+1}`;
  frame.querySelectorAll('[data-photo]').forEach(dot=>{
    dot.setAttribute('aria-pressed',String(Number(dot.dataset.index)===selected));
  });
}

function setModalPhoto(index){
  if(!currentProduct)return;
  const photos=photosFor(currentProduct);
  modalPhotoIndex=(index+photos.length)%photos.length;
  const img=$('#modalImage');
  img.src=`./assets/${photos[modalPhotoIndex]}`;
  img.alt=`Рюкзак NIKIFOROV ${currentProduct.name}, фото ${modalPhotoIndex+1} из ${photos.length}`;
  const thumbs=$('#modalThumbnails');
  if(thumbs.dataset.product!==currentProduct.id){
    thumbs.innerHTML=photos.map((photo,i)=>`
      <button class="modal-thumb" type="button" data-modal-photo="${i}" aria-label="Показать фото ${i+1} из ${photos.length}">
        <img src="./assets/${photo}" alt="" loading="lazy">
      </button>`).join('');
    thumbs.dataset.product=currentProduct.id;
  }
  thumbs.querySelectorAll('[data-modal-photo]').forEach(thumb=>{
    thumb.setAttribute('aria-pressed',String(Number(thumb.dataset.modalPhoto)===modalPhotoIndex));
  });
}

function openProduct(id,index=0){
  const p=productById(id);if(!p)return;
  currentProduct=p;
  $('#modalTitle').textContent=`Рюкзак ${p.name}`;
  $('#modalColor').textContent=p.color;
  setModalPhoto(index);
  openLayer('modal');
}

let lastCardSwipe=0;
grid.addEventListener('click',(e)=>{
  if(Date.now()-lastCardSwipe<320)return;
  const dot=e.target.closest('[data-photo]');
  if(dot){e.preventDefault();setCardPhoto(dot.dataset.photo,Number(dot.dataset.index));return;}
  const add=e.target.closest('[data-add]');
  if(add){e.stopPropagation();addToCart(add.dataset.add);return;}
  const open=e.target.closest('[data-open]');
  if(open){
    const index=Number(open.closest('.product-image-frame')?.dataset.activeIndex||0);
    openProduct(open.dataset.open,index);
  }
});
let cardTouch=null;
grid.addEventListener('touchstart',e=>{
  const frame=e.target.closest('.product-image-frame');
  if(!frame||e.touches.length!==1){cardTouch=null;return;}
  cardTouch={id:frame.dataset.product,x:e.touches[0].clientX,y:e.touches[0].clientY};
},{passive:true});
grid.addEventListener('touchend',e=>{
  if(!cardTouch||e.changedTouches.length!==1)return;
  const dx=e.changedTouches[0].clientX-cardTouch.x;
  const dy=e.changedTouches[0].clientY-cardTouch.y;
  if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.3){
    const frame=grid.querySelector(`[data-product="${cardTouch.id}"]`);
    const index=Number(frame?.dataset.activeIndex||0);
    setCardPhoto(cardTouch.id,index+(dx<0?1:-1));
    lastCardSwipe=Date.now();
  }
  cardTouch=null;
},{passive:true});
$('#modalThumbnails').addEventListener('click',e=>{
  const thumb=e.target.closest('[data-modal-photo]');
  if(thumb)setModalPhoto(Number(thumb.dataset.modalPhoto));
});
let modalTouch=null;
$('#modalImage').addEventListener('touchstart',e=>{
  if(e.touches.length===1)modalTouch={x:e.touches[0].clientX,y:e.touches[0].clientY};
},{passive:true});
$('#modalImage').addEventListener('touchend',e=>{
  if(!modalTouch||e.changedTouches.length!==1)return;
  const dx=e.changedTouches[0].clientX-modalTouch.x;
  const dy=e.changedTouches[0].clientY-modalTouch.y;
  if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.3)setModalPhoto(modalPhotoIndex+(dx<0?1:-1));
  modalTouch=null;
},{passive:true});
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
  if(activeLayer==='modal'&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){
    e.preventDefault();
    setModalPhoto(modalPhotoIndex+(e.key==='ArrowRight'?1:-1));
  }
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
