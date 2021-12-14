let datas= new Array();
let render_datas= new Array();
let cart_datas= new Array();

const PRODUCT_DOM= $(".item-list .item").eq(0);
const CART_DOM= $(".cart-list .item").eq(0);

$.getJSON(`/resources/js/store.json`,function(result) {
    result.map(x=> x.price=parseInt(x.price.replace(/,/g, '')));

    datas= result;
    render_datas= result;

    init();
});

function chosung(str) {
    let cho=['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
    let result=[];

    for(let i=0; i<str.length; i++) {
        let idx= ((str[i].charCodeAt()-44032)/588);
        result.push(cho[idx] || str[i]);
    }
    return result.join('');
}

function match(keyword, data) {
    let keywordCho= chosung(keyword);
    let dataCho= chosung(data);
    let result=[];
    let idx=-1;
    do {
        idx=dataCho.indexOf(keywordCho,idx+1);
        if(idx>-1) result.push(idx);
    }while(idx>-1);
    
    return result;
}

function search(keyword, data) {
    let indexes= match(keyword, data);
    let dataCho= chosung(data);
    let result=-1;

    indexes.forEach(idx=> {
        let flag= true;

        for(let i=0; i<keyword.length; i++) {
            let keywordChar= keyword[i];
            let dataChar= (keywordChar.match(/[ㄱ-ㅎ]/)? dataCho:data)[idx+i];
            if(keywordChar!= dataChar ) {
                flag= false;
                return;
            }
        }

        if(flag) {
            result=idx;
            return;
        }
    });
    return result;
}


function init() {
    $(".item-list .item").remove();
    $(".cart-list .item").remove();
console.log("DDD");
    moblieClick();

    updateProduct();
}

function updateProduct() {
    $(".item-list .item").remove();

    let keyword= $(".search input").val();

    render_datas.forEach(data=> {
        let clone=PRODUCT_DOM.clone();

        clone.find("img").attr("src", `./resources/img/store/${data.photo}`);
        clone.find("img").attr("data-idx", data.id);

        if(keyword=="") {
            clone.find("p").eq(0).text(data.brand);
            clone.find("p").eq(1).text(data.product_name);
        }else {
            let idx= search(keyword, data.brand);
            clone.find("p").eq(0).html(`${data.brand.substring(0,idx)}<mark>${data.brand.substring(idx,idx+keyword.length)}</mark>${data.brand.substring(idx+keyword.length)}`);
            idx= search(keyword, data.product_name);
            clone.find("p").eq(1).html(`${data.product_name.substring(0,idx)}<mark>${data.product_name.substring(idx,idx+keyword.length)}</mark>${data.product_name.substring(idx+keyword.length)}`);
        }
        clone.find("p").eq(2).text(`${data.price.toLocaleString()}`);

        $(".item-list").append(clone);

    });
    $(".item-list .item").draggable({"revert": true});
}

function moblieClick() {
    console.log($(".item-list .item"));
    $(".item-list .item").on("click", ()=> {
        console.log('이거');
    });
}

function updateCart() {
    $(".cart-list .item").remove();

    let sum=0;

    cart_datas.forEach(cart=> {
        let clone=CART_DOM.clone();
        let data= datas.find(x=> x.id== cart.idx);
        clone.find("img").attr("src", `./resources/img/store/${data.photo}`);
        clone.find("span").eq(0).text(data.product_name);
        clone.find("span").eq(1).text(data.brand);    
        clone.find("span").eq(2).text(`${data.price.toLocaleString()}`);
        clone.find("input").val(cart.cnt);
        clone.find("input").attr("data-idx", cart.idx);
        clone.find("span").eq(3).text(`${(data.price*cart.cnt).toLocaleString()}`);
        clone.find("button").attr("data-idx", cart.idx);
        sum+=data.price*cart.cnt;
        $(".cart-list").append(clone);
        let close= clone.find(".close");
        close.on("click", ()=> {
            clone.remove();

            let index= cart_datas.findIndex(x=> {
                return x.idx=== cart.idx;
            });
            cart_datas.splice(index,1);
            sum-=data.price*cart.cnt;
            $(".cart-info span").text(`총 합계 : / ${sum.toLocaleString()}`);
        });
    });
    $(".cart-info span").text(`총 합계 : / ${sum.toLocaleString()}`);
}

$(".drop").droppable({
    drop:function(event, ui){
        let idx= ui.draggable.find("img").data("idx");
        let find= cart_datas.find(x=> x.idx== idx);
        if(find==undefined) {
            cart_datas.push({idx:idx, cnt:1});
        }else {
            alert("이미 장바구니에 담긴 상품 입니다.");
        }
        updateCart();
    }
});

$(document).on("keyup change", ".cart-list .item input", function() {
    let idx=$(this).data("idx");
    let value=$(this).val();

    if(value<1) {
        $(this).val(1);
        value=$(this).val();
    }

    cart_datas.find(x=> x.idx== idx).cnt=value;
    updateCart();
});

$(document).on("click", ".cart-list .item button", function(){
    let idx= $(this).data("idx");

    cart_datas.filter(x=> x.idx!= idx);
    updateCart();
});

$(".search input").on("keyup change", function() {
    let keyword=$(this).val();

    if(keyword=="") {
        render_datas=datas;
    }
    else {
        render_datas= new Array();

        datas.forEach(data=> {
            if(search(keyword, data.product_name)>-1 || search(keyword, data.brand)>-1)render_datas.push(data);
        });
    }
   updateProduct();
});

$(".cart-info button").on("click", function() {
    $(".modal-pay-1 input").val('');
    $(".modal-pay-1").dialog("open");
});

$(".modal-pay-1 button").on("click", function() {
    $(".modal-pay-1").dialog("close");
    $(".modal-pay-2").dialog("open");   
    

    let canvas= document.createElement("canvas");
    canvas.width=1400;
    canvas.height=900;
    let ctx=canvas.getContext("2d");

    let print='';
    let sum=0;
    cart_datas.forEach(cart=> {
        let data= datas.find(x=> x.id==cart.idx);
        print+=`상품명 : ${data.product_name}  |  `;
        print+=`가격 : \ ${data.price.toLocaleString()}  |  `;
        print+=`수량 : ${cart.cnt}  |  `;
        print+=`합계 : \ ${(data.price*cart.cnt).toLocaleString()}  |  `;

        sum+=cart.cnt*data.price;
    });

    print+=`총 합계 : ${sum.toLocaleString()}  |  `;
    print+=`구매일시 : ${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()} ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`;

    ctx.fillText(print, 5,10);
    $(".modal-pay-2")[0].append(canvas);
    cart_datas= new Array();
});

$(".modal").dialog({autoOpen:false});
$(".modal-pay-2").dialog({width:570,height:300});