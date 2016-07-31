// Ad-hoc promotion at line 450
// Disable ordering at line 4

var orderingDisabled = false;
var test = false;
var globalScrollingTriggerDisable;	// used to keep animations from auto-starting when auto-scrolling
var cookieOptions = {domain:'.tenonedesign.com',path:'/'};
var deviceSupportsInlineVideo = true;
var deviceIsIPhone = (navigator.userAgent.indexOf('iPhone') != -1);
var percentOfScreenPixelRatioThatIsOK = .92; // 0.85 works and is a little crunchy but reduces some retina requests
var imageSizeQuantizationInterval = 100;	// retina images loaded later will snap to this interval to reduce server processing and caching load
// deviceSupportsInlineVideo = (deviceIsIPhone == false);
var requiredWidthForAutostartingVideo = 700;

function convertSpacesToUnderscore(string) {
	return string.replace(/ /g, "_");
}
function cssStringWithString(string) {
	string = string.replace(/ /g, "_");
	return string.replace(/\?/g, "");
}
function convertDashesToUnderscore(string) {
	return string.replace(/-/g, "_");
}
function mastheadScroll() {
	var mastheadTop = $(".masthead_positioner").offset().top;
	$('.masthead_fixable').toggleClass('masthead_fixed', $(window).scrollTop() > mastheadTop);
}




// oCart
function showOCart() {
	hideAddedItemsAnimated(false);
	scrollableOCartScrolled();
	$(".oCart").addClass("oCartShow");
}
function hideOCart() {
	$(".oCart").removeClass("oCartShow");
}
function disableOCartHover() {
	// console.log("disable");
	$(".oCart").remove();
}
function showOCartPurchaseOptions() {
	$(".oCartPurchaseOptions").addClass("oCartPurchaseOptionsShow");
}
function hideOCartPurchaseOptions() {
	$(".oCartPurchaseOptions").removeClass("oCartPurchaseOptionsShow");
}
function toggleOCartPurchaseOptions() {
	$(".oCartPurchaseOptions").toggleClass("oCartPurchaseOptionsShow");
}
function setAndShowAddedItemsDuration(items, duration) {
	hideAddedItemsAnimated(false);
	$(".oCartAddedItemHolder").empty();
	for (key in items) {
		$(".oCartAddedItemHolder").append(oCartItemWithPartNumberQuantityFromTemplate(key,items[key]));
	}
	showAddedItemsDuration(duration);
}

function showAddedItemsDuration(duration) {
	clearTimeout(showAddedItemsDuration.timer);
	$(".oCartAddedItem").addClass("oCartAddedItemShow");
	showAddedItemsDuration.timer = setTimeout("hideAddedItemsAnimated(true)",duration);
}
function hideAddedItemsAnimated(animated) {
	if (animated) $(".oCartAddedItem").removeClass("oCartAddedItemShow");
	else {
		$(".oCartAddedItem").addClass("notransition");
		$(".oCartAddedItem").removeClass("oCartAddedItemShow");
		$(".oCartAddedItem")[0].offsetHeight;
		$(".oCartAddedItem").removeClass("notransition");
	}
}
function updateOCart() {
	var t1Cart = readOCartDataFromCookie();
	var subtotal = 0;
	$(".oCartScrollableCart").find(".oCartCartItem").addClass("oCartDeleteItemByDefaultFlag");
	for (key in t1Cart) {
		if (productData[key] === undefined) { console.log("found corrupt cart. deleting."); writeOCartDataToCookie({}); return; }
		var quantity = t1Cart[key];
		var alreadyExistsInCart = false;
		subtotal += (productData[key].price * quantity);
		$(".oCartScrollableCart").find(".oCartCartItem").each(function() {
			if ($(this).find(".oCartItemPartNumber").text() == key && !$(this).hasClass("cartItemIsBeingAnimatedOut")) {
				$(this).find(".oCartItemQuantityNumber").text(quantity);
				$(this).removeClass("oCartDeleteItemByDefaultFlag");
				alreadyExistsInCart = true;
			}
		});
		if (!alreadyExistsInCart) {
			$(".oCartScrollableCart").append(oCartItemWithPartNumberQuantityFromTemplate(key,quantity));
		}
	}
	$(".oCartDeleteItemByDefaultFlag").addClass("cartItemIsBeingAnimatedOut").slideUp(function() {
		$(this).remove();
		showEmptyNoticeInOCartIfEmpty();
	});
	showEmptyNoticeInOCartIfEmpty();
	$(".oCartSubtotalNumber").html(subtotal.toFixed(2));
	showCartNumberInMasthead();
}

function partShouldBeRemovedFromCartUI(partNumber,cartUI,cartData) {
	$(".cartCart").find(".cartCartItem").each(function() {
		if ($(this).find(".cartItemPartNumber")) {
			
		}
	});
}

function updateCartAnimated(animated) {
	var t1Cart = readOCartDataFromCookie();
	var subtotal = 0;
	var cartPrice = 0;
	var cartSoftwareLineItemCount = 0;
	var cartLineItemCount = 0;
	$(".cartCart").find(".cartCartItem").addClass("cartDeleteItemByDefaultFlag");
	for (key in t1Cart) {
		var quantity = t1Cart[key];
		var alreadyExistsInCart = false;
		cartLineItemCount ++;
		if (productData[key].software == 1) cartSoftwareLineItemCount ++;
		subtotal += (productData[key].price * quantity);

		// keep existing ui item if it's also in the cart data
		$(".cartCart").find(".cartCartItem").each(function() {
			if ($(this).find(".cartItemPartNumber").text() == key && !$(this).hasClass("cartItemIsBeingAnimatedOut")) {
				$(this).find(".cartItemQuantityNumber").text(quantity);
				$(this).find(".cartItemSubtotal").html("$"+(productData[key].price * quantity).toFixed(2));
				$(this).find(".cartItemFullPriceSubtotal")
					.html("$"+(productData[key].fullprice * quantity).toFixed(2))
					.toggleClass('hidden', (productData[key].price == productData[key].fullprice));
				$(this).removeClass("cartDeleteItemByDefaultFlag");
				alreadyExistsInCart = true;
			}
		});
		if (!alreadyExistsInCart) {
			// console.log("adding " +key);
			$(".cartCart").append(cartItemWithPartNumberQuantityFromTemplate(key,quantity));
		}
	}
	if (animated) {
		$(".cartDeleteItemByDefaultFlag").addClass("cartItemIsBeingAnimatedOut").slideUp(function() {
			$(this).remove();
			showEmptyNoticeInCartIfEmpty();
		});
	}
	else {
		$(this).remove();
		showEmptyNoticeInCartIfEmpty();
	}
	showEmptyNoticeInCartIfEmpty();
	showTotalsAndUpdateShipping(subtotal.toFixed(2),cartLineItemCount,cartSoftwareLineItemCount);
	showCartNumberInMasthead();
}

function showTotalsAndUpdateShipping(cartPrice,cartLineItemCount,cartSoftwareLineItemCount) {
	// console.log(cartLineItemCount+" sw:"+cartSoftwareLineItemCount);
	reduction = calculateDiscount(cartPrice,$("#couponDiscount").text());
	reduction = (reduction*1).toFixed(2);	// round to cent
	$("#couponPaypal").text(reduction);	// store for Paypal submit
		// if (reduction>0) $("#couponDisplay").text("-$" + reduction + " ");	// display if nonzero
		// else $("#couponDisplay").text("");
	var cartShipping = $("#checkoutCartShippingSelect");
	var cartSoftwareShipping = $("#checkoutCartSoftwareShippingSelect");
	
	if (cartSoftwareLineItemCount==cartLineItemCount && cartLineItemCount >0) {	// only software in cart
		cartShipping.hide();
		cartSoftwareShipping.show();
		var cartNewShipping = 0;
		$("#checkoutCartShippingPrice").text(0.00);
	}
	else {
		cartShipping.show();
		cartSoftwareShipping.hide();
		var cartNewShipping = shippingData[cartShipping.val()].price*1;
		$("#checkoutCartShippingPrice").text(cartNewShipping.toFixed(2));
		
		// clone the object so we can modify the clone
		var modifiedShippingData = jQuery.extend(true, {}, shippingData);

		// check for free shipping flag in coupon
		if ($("#couponDiscount").text()) {
			console.log("checking coupon discount");
			discount = JSON.parse($("#couponDiscount").text());
			console.log(discount);
			if (discount.allows_free_shipping==1) {
				modifiedShippingData['FC'].freeOver = 0;
				modifiedShippingData['FCN'].freeOver = 0;
				modifiedShippingData['FCN'].display = 1;
			}
		}
		
		makeShippingOptionsWithData(modifiedShippingData);
		if (Math.max(cartPrice - reduction,0) >= modifiedShippingData[cartShipping.val()].freeOver*1) {
			$("#checkoutCartShippingPrice").html("&nbsp;<span style='color: green'>Free!</span>");
			cartNewShipping = 0;
		}

		
	}
	cartPrice = cartPrice*1 - reduction;	// minus discount
	if (cartPrice<0) cartPrice = 0.00;
	cartPrice += cartNewShipping;
	$("#checkoutCartTotalPrice").text(cartPrice.toFixed(2));
}
 
function showEmptyNoticeInCartIfEmpty() {
	if ($(".cartCart").find(".cartCartItem").length) $(".cartEmptyCartNotice").hide();
	else $(".cartEmptyCartNotice").show();
}
function showEmptyNoticeInOCartIfEmpty() {
	if ($(".oCartScrollableCart").find(".oCartCartItem").length) $(".oCartEmptyCartNotice").hide();
	else $(".oCartEmptyCartNotice").show();
}
function scrollableOCartScrolled() {
	var cart = $(".oCartScrollableCart");
	var lastItem = cart.find(".oCartCartItem").last();
	if (!lastItem.length) return false;
	if (isElementWithinParent(lastItem)) $(".oCartCheckoutSection").removeClass("oCartCheckoutSectionShowShadow");
	else $(".oCartCheckoutSection").addClass("oCartCheckoutSectionShowShadow");
}
function addToOCartButtonPressed(element) {	
	if (!element.attr("data-cart")) return false;
	if (element.hasClass("addToOCartDisabled")) return false;
	var data = JSON.parse(element.attr("data-cart"));
	var cartAdd = data['cartAdd'];
	for (key in cartAdd) {
		addPartNumberQuantityToOCartCookie(key,cartAdd[key]);
	}
	updateOCart();

	if ($("body#cart").length > 0) {
		updateCartAnimated(true);
	}
	else {
		setAndShowAddedItemsDuration(cartAdd,4000);
	}
}

function changeQuantityOCartButtonPressed(button) {
	var partNumber = button.parents(".oCartCartItem").find(".oCartItemPartNumber").text();
	var quantityAdjust = -1;
	if (button.hasClass("oCartAddOne")) { quantityAdjust = 1; }
	addPartNumberQuantityToOCartCookie(partNumber,quantityAdjust);
	updateOCart();
}
function changeQuantityCartButtonPressed(button) {
	var partNumber = button.parents(".cartCartItem").find(".cartItemPartNumber").text();
	var quantityAdjust = -1;
	if (button.hasClass("cartAddOne")) { quantityAdjust = 1; }
	addPartNumberQuantityToOCartCookie(partNumber,quantityAdjust);
	updateCartAnimated(true);
}
function cartItemRemoveButtonPressed(button) {
	var partNumber = button.parents(".cartCartItem").find(".cartItemPartNumber").text();
	var quantity = button.parents(".cartCartItem").find(".cartItemQuantityNumber").text();
	addPartNumberQuantityToOCartCookie(partNumber,quantity * -1);
	updateCartAnimated(true);
}
function readOCartDataFromCookie() {
	var t1Cart = {};
	if ($.cookie("t1CartItems") && $.cookie("t1CartItems") != "null") {
		t1Cart = JSON.parse($.cookie("t1CartItems"));
	}
	return t1Cart;
}
function writeOCartDataToCookie(data) {
	$.cookie("t1CartItems",JSON.stringify(data),cookieOptions);
}
function addPartNumberQuantityToAnalytics(partNumber, quantity) {
	var eventName = (quantity>0)?"addToCart":"removeFromCart";
	var ecommerceKey = (quantity>0)?"add":"remove";
	var positiveQuantity = Math.abs(quantity);
	var newAnalyticsData = {
		'event': eventName,
		'ecommerce': {},
	};
	newAnalyticsData.ecommerce[ecommerceKey] = {
		'products': [{
			'name': productData[partNumber].name,
			'id': partNumber,
			'price': productData[partNumber].price,
			'quantity': positiveQuantity,
			'brand': 'Ten One Design',
			// 'category': 'Apparel',
			// 'variant': 'Gray',
		}]
	};	
	dataLayer.push(newAnalyticsData);
	// console.log(dataLayer);
}
function addPartNumberQuantityToOCartCookie(partNumber, quantity) {
	var t1Cart = readOCartDataFromCookie();
	if (t1Cart[partNumber] == undefined) {
		t1Cart[partNumber] = quantity * 1;
	}
	else {t1Cart[partNumber] += quantity * 1;}
	if (t1Cart[partNumber] <= 0) delete t1Cart[partNumber];	// handle any negative numbers
	writeOCartDataToCookie(t1Cart);
	addPartNumberQuantityToAnalytics(partNumber, quantity);
}

function oCartItemWithPartNumberQuantityFromTemplate(partNumber, quantity) {
	var newItem = $(".oCartCartItemTemplate").clone();
	newItem.removeClass("oCartCartItemTemplate");
	newItem.find(".oCartItemImage img").attr("src",productData[partNumber].checkoutimage);
	newItem.find(".oCartItemName").html(productData[partNumber].name);
	newItem.find(".oCartItemDescription").html(productData[partNumber].description);
	newItem.find(".oCartItemQuantityNumber").html(quantity);
	newItem.find(".oCartItemSubtotal").html("$"+(productData[partNumber].price * quantity).toFixed(2));
	newItem.find(".oCartItemPrice").html(productData[partNumber].price);
	newItem.find(".oCartItemSoftware").html(productData[partNumber].software);
	newItem.find(".oCartItemPartNumber").html(partNumber);
	return newItem;
}
function cartItemWithPartNumberQuantityFromTemplate(partNumber, quantity) {
	var newItem = $(".cartCartItemTemplate").clone();
	newItem.removeClass("cartCartItemTemplate");
	newItem.find(".cartItemImage img").attr("src",productData[partNumber].checkoutimage);
	newItem.find(".cartItemImage a").attr("href",productData[partNumber].url);
	newItem.find(".cartItemName").html("<a href='"+productData[partNumber].url+"'>"+productData[partNumber].name+"</a>");
	newItem.find(".cartItemDescription").html(productData[partNumber].description);
	var inStock = (productData[partNumber].stockstatus.toLowerCase().trim() == "in stock");
	var warnClass=(inStock)?"":"shipWarning";
	var prependCheck=(inStock)?'<i class="fa fa-check"></i>  ':'';
	newItem.find(".cartItemStockStatus").html(productData[partNumber].stockstatus).addClass(warnClass).prepend(prependCheck);
	newItem.find(".cartItemCompatibility").html(productData[partNumber].compatibility);
	newItem.find(".cartItemQuantityNumber").html(quantity);
	newItem.find(".cartItemSubtotal").html("$"+(productData[partNumber].price * quantity).toFixed(2));
	newItem.find(".cartItemFullPriceSubtotal")
		.html("$"+(productData[key].fullprice * quantity).toFixed(2))
		.toggleClass('hidden', (productData[key].price == productData[key].fullprice));
	newItem.find(".cartItemPrice").html(productData[partNumber].price);
	newItem.find(".cartItemSoftware").html(productData[partNumber].software);
	newItem.find(".cartItemPartNumber").html(partNumber);
	return newItem;
}



// Masthead Search

function clearMastheadSearch() {
	searchInput = $(".masthead_search_dropdown input");
	searchInput.val("");
	searchInput.keyup();
	if ($(".masthead_search_dropdown").hasClass("masthead_search_dropdown_show")) {
		setTimeout(function() { searchInput.focus() }, 20);
	}
}
function hideMastheadSearch() {
	pushMastheadSearchPhrase();
	$(".masthead_search_dropdown").removeClass("masthead_search_dropdown_show");
	$(".masthead_search_dropdown input").blur();
}
function loadMastheadSearchResultsOnce() {
	if ( typeof loadMastheadSearchResultsOnce.counter == 'undefined' ) {
		arbitraryServerFunction("searchResultSet","",function(data) {
			$(".resultsContainer").html(data);
			console.log("data loaded");
		});
		loadMastheadSearchResultsOnce.counter = true;
	}
}
function pushMastheadSearchPhrase() {
	var searchString = $.trim($(".searchInput")[0].value).toLowerCase();
	 
	if (searchString.length > 0) {
		if (pushMastheadSearchPhrase.lastSearchString != searchString) {
			console.log("push "+searchString);
			// creates a virtual page view with ?virtualquery=searchString
			// ga is configured to use virtualquery as indicator of search for searchString
			// cutom event trigger makes the logging tag fire
			dataLayer.push({"dataLayerQueryString":"?virtualquery="+searchString});
			dataLayer.push({"event":"searchQueryMade"});
			pushMastheadSearchPhrase.lastSearchString = searchString;
		}
	}
}




$( document ).ready(function() {	// earlier than "load"
	showCartNumberInMasthead();
	clearMastheadSearch();
	// blurPlaceholders();
	
	$(".pdrMovableHeader").prependTo(".productDetailContainer");
	
	if (deviceSupportsInlineVideo == false) { 
		$(".pdrvideo").parents(".pdrfeature").addClass("pdrnoinlinevideo");
	}
	
	if ($("#checkout").length == 0 && $("body#cart").length == 0 && $("#payment").length == 0) {	// don't show on cart page or payment page
		$(".masthead_menu li.cart").on("touchstart",function(e) { disableOCartHover(); });	// go straight to cart page on touch devices
		$(".oCart, .masthead_menu li.cart").mouseenter(function(e) { showOCart(); });
		$(".oCart, .masthead_menu li.cart").mouseleave(function(e) { hideOCart(); });
		$(".oCartAddedItem").mouseenter(function(e) { showAddedItemsDuration(100000); });
		$(".oCartAddedItem").mouseleave(function(e) { hideAddedItemsAnimated(true); });
		
		// bring up the purchasing options so they're easy to reach from the top
		$(".pdraddtocartsection").first().clone(true).appendTo(".oCartPurchaseOptions");
		$(".oCartPurchaseOptions, .masthead_menu_add_to_cart").mouseenter(function(e) { showOCartPurchaseOptions(); });
		$(".oCartPurchaseOptions, .masthead_menu_add_to_cart").mouseleave(function(e) { hideOCartPurchaseOptions(); });
		// provide easy way to close on a phone
		$(".masthead_menu_add_to_cart").on("touchstart",function(e) { toggleOCartPurchaseOptions(); });
	}
	$(".masthead_menu_dropdown, .masthead_compact").mouseenter(function(e) {
		$(".masthead_menu_dropdown").addClass("masthead_menu_dropdown_show");
	});
	$(".masthead_menu_dropdown, .masthead_compact").mouseleave(function(e) {
		$(".masthead_menu_dropdown").removeClass("masthead_menu_dropdown_show");
	});
	$(".masthead_search_dropdown, .masthead_menu_search").mouseenter(function(e) {
		$(".masthead_search_dropdown").addClass("masthead_search_dropdown_show");
		loadMastheadSearchResultsOnce();
		setTimeout(function() { $(".masthead_search_dropdown input").focus(); }, 400);
	});
	$(".masthead_search_dropdown, .masthead_menu_search").mouseleave(function(e) {
		hideMastheadSearch();
	});
	$(".masthead_menu_search").on("click",function() { return false; });
	$(".searchClearLink").on("click",function() {
		clearMastheadSearch();
	});
	$(".resultsContainer").on("click",function() { pushMastheadSearchPhrase(); });

	
	// push searches to data layer
	// show "no results found" when search yields nothing
	
	
	// show results that have at least a partial match for all words
	$(".searchInput").keyup(function(e) {
	
		if (e.keyCode === 27) {	// if escape, hide dropdown and clear search
			hideMastheadSearch();
			setTimeout("clearMastheadSearch()",200);
		}
	
		results = $(".searchResult");
	    var val = $.trim(this.value).toLowerCase();
		results.hide();
		$(".noResultsContainer").hide();
		
	    if (val === "") {
	        $(".searchClearLink").removeClass("searchClearLinkShow");
	    }
	    else {
	        $(".searchClearLink").addClass("searchClearLinkShow");
        
	        var wordArray = val.split(" ");
	        var resultArray = results;
	        for (var i = 0; i < wordArray.length; i++) {
	        	// any partial results for this word?
				var resultsForWord = results.filter(function() {
	    	        return -1 != $(this).find(".searchResultLabel").text().toLowerCase().indexOf(wordArray[i]);
		    	});
		    	resultArray = resultArray.filter(resultsForWord);	// remove anything not matching current word
			}
			resultArray.show();
			if (resultArray.length == 0) {
				$(".noResultsContainer").show();
			}
	    }
	});
	
	
	
	// causes whole page to be clickable, allowing hover to move around when another part of page is touched
	// this helps the ocart hide
	// it's big enough that the whole screen doesn't seem to flash dark like a normal link when clicked (unless entire container is visible)
	$("#container").click(function() { void(0); });

	$(".pdrbuysectionmore").on("click",function() {
		$(this).parent().find(".pdraddtocartexpansion").slideToggle(300,function() { 			$(".pdrbuysectionmore").toggleClass("pdrbuysectionmorehidden");
		});
	});
	$(".masthead_menu_add_to_cart").click(function() {
		scrollToAnchor("pdrBuyAnchor",function() {
			// console.log("done scrolling");
		}, 80);	
		return false;
	});
	// for some reason, avoiding an anonymous function here makes performance seem better.
	// hard to prove. hard to clock.
	if ($(".masthead_positioner").length > 0) {
		window.addEventListener('scroll', mastheadScroll, false);
		mastheadScroll();	// triggers when the back button is hit as well
	}
	updateOCart();

});


$(window).on("load",function(){

	// remove old cookies using "tenonedesign.com" domain instead of ".tenonedesign.com"
	// remove this code in August 2016 because sure nobody will have this issue after then
	// the issue is Chrome (at least) seems to prefer the tenonedesign.com cookie to the .tenonedesign.com one
	// maybe because it's more specific.  Anyway, when both are set, it's a big problem and nothing gets added to cart
	// $.removeCookie("t1CartItems");
	// $.removeCookie("t1CartCoupon");
	// $.removeCookie("t1CartShipping");
	// $.removeCookie("t1MastheadNoticeShouldHide");
	
	// $(window).scroll(function() {
	//
	// });
	
	// $("#container").css("margin-top",$(".mastheadNoticeDiv").height());
	
	// $(".toggleMastheadColor").click(function() {
	// 	$(".masthead_stripe").toggleClass("masthead_stripe_dark");
	// });
	// $(".toggleMastheadWidth").click(function() {
	// 	$(".masthead_stripe").toggleClass("masthead_stripe_narrow");
	// });
	
	// Snow effect December 2010,11
	// $('body').prepend('<div id="pageBgSnow"></div>');
	// $('#pageBgSnow').css({ 'position':'fixed', 'top':'170px', 'width':'100%', 'height':'511px', 'background':'url(../images/masthead_bg_snow.jpg) 0 0 repeat-x', 'display':'none'});
	// $('#pageBgSnow').fadeTo(0,.3);
	// $('#pageBgSnow').fadeTo(1000,1);
	
	
	// if ($(".fadingSlideshow").length) {
	// 	$('.fadingSlideshow').cycle({
	// 	    fx:     'fade',
	// 	    timeout: 6000,
	// 		delay:	1000,
	// 		speed:	1500
	// 	});
	// }
		
	if ($("body#soundclip").length)
	{
	//	$.fn.media.mapFormat('mp3', 'quicktime');
		$('a.audioMedia').media( { width: 300, height: 20 } );
		$('a.galleryMedia').media( { width: 320, height: 500 } );
		$('a.galleryMediaWide').media( { width: 480, height: 340 } );
	}
	// $(".equalheights").equalHeights(100,15000);
	
	
	// CHECKOUT LINK
	$("a.faderLink").click(function() {
		$(this).children().fadeTo("fast", ".5");
		$(this).children().fadeTo("fast", "1", function(){
			document.location=$(this).parents().attr("href");
		});
		return false
	});
	$(".t1Button").on("click",function() {
		var link = $(this).attr('data-link');
		if (link) {
			window.location = link;
			return false;
		}
	});
	
	// masthead notice
	$(".mastheadNoticeCloseLink").click(function() {
		$(".mastheadNoticeDiv").slideUp();
		$.cookie("t1MastheadNoticeShouldHide",true,cookieOptions);
		// this session cookie hides the notice in masthead.php
	});
	$(".t1PreviewCloseLink").click(function() {
		$(".t1PreviewBanner").slideUp();
	});

	

	// RETINA SUPPORT............................................................................. //
	
	// why setTimeout? images don't get sized properly otherwise. probably bumps it until the next 'runloop'
	setTimeout(function() {
			if (retinaDisplay() || true) {
				// do the majority of the work
				replaceSLIRImagesWithRetina($('.hires img').not('.checkoutItemImage img'));
	
				// these images are not suitable for auto-resizing, so they are done manually with _2x alternates
				// replaceImagesWithRetina($(".pdVideoCloseControl img"));	// video back button
			}
		},0);
	

	// CODE FOR THE PRODUCT DETAIL PAGES.......................................................... //
	$(".productDetailMenu li").click(function() {
		if ($(this).hasClass("addToCart")) return true;
		if ($(this).hasClass("addToOCart")) return true;
		var myName = cssStringWithString($(this).text());
		var chosenDiv = $(this).parents(".productDetailContainer").find("#productDetailPage"+myName);
		$(this).parents(".productDetailContainer").find(".productDetailPage").hide();
		chosenDiv.fadeIn("slow");
		$(this).siblings().removeClass("productDetailTabSelected");
		$(this).addClass("productDetailTabSelected");
		return true	// so it can propogate to an add to cart event
	});
	
	// if there's a get variable specifying the tab, use it.  Otherwise, select the first tab (the tabs are reversed, and start at 0).	
	var numberOfTabs = $(".productDetailMenu li").length;
	var selectedTabInURL = getParameterByName("tab");
	var selectedTab = selectedTabInURL?(numberOfTabs - selectedTabInURL):numberOfTabs-1;
	$(".productDetailMenu li").eq(selectedTab).click();	// click the default tab when the page loads
	$(document).on("click", ".tabClick", function() {
		var children = $(".productDetailMenu").children();
		var count = children.size();
		children.eq(count - $(this).attr("number")).click();
		return false
	});
	
	// if there's a hash, scroll to that location on the page after the page is shown
	if (window.location.hash)
	{
		setFAQsVisibleAnimated(true,false);
		var hash = window.location.hash.replace("#", "");
		window.location.hash = "";	// kill the hash so it doesn't jump to that location
		// replace hash for cosmetics (removing leftover #)
		if ("replaceState" in history) { history.replaceState("", document.title, window.location.pathname + window.location.search); }
		scrollToAnchorAndHighlightNext(hash);
	}
	var targetAnchor = getParameterByName('scrollToAnchor');
	if (targetAnchor) scrollToAnchor(targetAnchor);
	
	
	$(".showAllAnswers").add(".pdrdetailsfaqsshowhide").click(function() { $(this).parents(".faqs").find("h2").click(); });
	
	function setFAQsVisibleAnimated(visible,animated) {
		var speed = (animated)?"fast":0;
		if (visible) {
			$(".pdrdetailsfaqslist").animate({ height:"toggle", opacity:"toggle" },speed);
			$(".pdrdetailsfaqscontrolon").animate({ height:"toggle", opacity:"toggle" },0);
			$(".pdrdetailsfaqscontroloff").animate({ height:"toggle", opacity:"toggle" },0)	;
			// swap locations so they animate the same way when hiding faqs
			$(".pdrdetailsfaqscontrolon").before($(".pdrdetailsfaqscontroloff"));
		}
		else {
			$(".pdrdetailsfaqslist").animate({ height:"toggle", opacity:"toggle" },speed, function() {
				$(".pdrdetailsfaqscontrolon").animate({ height:"toggle", opacity:"toggle" },0);
				$(".pdrdetailsfaqscontroloff").animate({ height:"toggle", opacity:"toggle" },0);
				$(".pdrdetailsfaqscontroloff").before($(".pdrdetailsfaqscontrolon"));
			});
		}
	}
	$(".pdrdetailsfaqsshow").click(function() {
		setFAQsVisibleAnimated(true,true);
	});
	$(".pdrdetailsfaqshide").click(function() {
		setFAQsVisibleAnimated(false,true);
	});
	$(".pdrdetailsfaqsshow").click(function() { $(".pdrdetailsfaqs").show });
	
	$(".faqs h2").click(function() {
		$(this).next().slideToggle("fast");
	});
	$(".faqs a").click(function() {
		var hash = this.hash.replace("#", "");
		if (hash) {
			scrollToAnchorAndHighlightNext(hash);
			return false;
		}
	});
	
	
	$(".videoStillDiv, .videoControlDiv").click(function() {
		$(this).parent().find('.videoControlDiv').fadeOut();
		$(this).parent().find('.videoStillDiv').fadeOut();
		$(this).parent().find("object")[0].playVideo();
		return false
	});
	

	// alternate pdrimage button handling
	$(".showAltImage").on("click",function() {
		var button = $(this);
		if (button.attr("data-button-text-off") === button.html()) {
			var container = button.parents(".pdrfeature");
			var altSource = button.attr("data-alt-source");
			var altImageElement = document.createElement('img');
			altImageElement.setAttribute('style', 'position: absolute; left: 0; top: 0; opacity: 0; transition: opacity 1s ease-in-out;');
			container[0].appendChild(altImageElement);
			$(altImageElement).addClass("pdrimage").addClass("pdrimagealt");	// so it stays responsive like the original
			altImageElement.onload = function() {
				$(this).css("opacity","1");
				button.html(button.attr("data-button-text-on"));
			};
			altImageElement.setAttribute('src', altSource);
		}
		else {
			button.html(button.attr("data-button-text-off"));
			button.parents(".pdrfeature").find(".pdrimagealt").css("opacity","0");
		}
	});
	
	
	
	
	$(".pdFeaturedAppNext").click(function() {
		var websiteDataName = $(this).attr('data-featured-apps');
		var imageWidth = $(this).attr('data-image-width');
		
		arbitraryServerFunction("cmsGetAffiliateReadyWebsiteDataWithNameCampaign",websiteDataName+"|~",function(data) {
			var appsTemp = JSON.parse(data);
			var apps = {};
			var currentApp = $(".pdFeaturedAppCurrent").val();
			var nextApp, lastAppInLoop;
			// strip apps object of all non-displayed data
			for(key in appsTemp) {
				if (key != 'selected' && appsTemp[key].display == 1 && appsTemp[key].feature == 1) apps[key] = appsTemp[key];
			}
			// find next entry, if there is one.
			for(key in apps) {
				if (lastAppInLoop == currentApp) {	
					nextApp = key;
					break;
				}
				lastAppInLoop = key;
			}
			// if currentApp was last in array, wrap around to get the first.
			if (!nextApp) {
				for(key in apps) {
					nextApp = key;
					break;
				}
			}	
			var im = new Image();			
			im.src = "/php/slir/w"+imageWidth+"-q100/" + apps[nextApp].screenShotImage;	// prefetch image so the page doesn't jump around as the image loads.  totally works.
			$(".pdFeaturedAppScreenShotImage").animate({ marginRight: "-=400" },function() {
				$(".pdFeaturedAppScreenShotImage").animate({ marginRight: "+=400" });
			});
			$(".pdFeaturedApp").delay(180).fadeOut("fast",function() {
				// populate the data
				$(".pdFeaturedAppCurrent").val(nextApp);
				$(".pdFeaturedAppTitle a").text("lovely "+apps[nextApp].appTitle);
				$(".pdFeaturedAppLinkTitle").text(apps[nextApp].appTitle);
				$(".pdFeaturedAppImage").html("<img src=\"/php/slir/w75-q100/" + apps[nextApp].appIcon + "\" alt=\"\" />");
				$(".pdFeaturedAppTitle").html("<a href=\"" + apps[nextApp].appLink + "\">" + apps[nextApp].appTitle + "</a>");
				$(".pdFeaturedAppLink").parent().attr("href",apps[nextApp].appLink);
				$(".pdFeaturedAppDescription").text(apps[nextApp].appText);
				$(".pdFeaturedAppQuoteText").html(apps[nextApp].quote);
				$(".pdFeaturedAppAttributionText").html(apps[nextApp].quoteAttribution);
				$(".pdFeaturedAppScreenShotImage").html("<a href=\"/php/slir/w800/" + apps[nextApp].screenShotImage + "\"><img src=\"/php/slir/w" + imageWidth + "-q100/" + apps[nextApp].screenShotImage + "\" alt=\"\" /></a>");
				$(this).fadeIn();
			});
	
		});
		return false;
	});
	$(".arbitraryFunctionDiv").each(function() {
		var functionName = $(this).attr("function");
		var params = $(this).attr("params");
		var destination = $(this);
		var callback = $(this).attr("callback");
		$.ajax({
			url: 'php/handler.php',
			type: 'POST',
			timeout: 0,
			dataType: 'html',
			data: functionName+"="+params,
			success: function (data, textStatus) {
				destination.html(data);
				$(".lightbox").each(function() {
					$("a", this).filter(function(index) {
					  return $('img', this).length == 1;
					}).lightBox();
				});
				if (callback) { eval(callback+"()");}
			}
	
		});
	
	});

	$(".oCartScrollableCart").on("scroll", function() {
		scrollableOCartScrolled();
	});
	$(document).on("click", ".addToOCart", function() {
		addToOCartButtonPressed($(this));
		return false;
	});
	$(document).on("click", ".oCartItemQuantityControls i", function() {
		changeQuantityOCartButtonPressed($(this));
		return false;
	});
	$(document).on("click", ".cartItemQuantityControls i", function(event) {
		changeQuantityCartButtonPressed($(this));
		return false;
	});
	$(document).on("click", ".cartItemRemoveButton", function() {
		cartItemRemoveButtonPressed($(this));
		return false;
	});
	
	$(".checkoutLink").on("click",function() {
		var link = $(this).attr('data-checkout-link');
		if (link) window.location = link;
	});
	$(".cartOrderingPolicies").on("click",function() {
		showOverlayWithContent($(".shippingFAQText").html());
		return false;
	});
	


	
	$(document).on("click", ".addToCart", function() {
		var data = JSON.parse($(this).attr("data"));
		var cartAdd = data['cartAdd'];
		
		if($("body#checkout").length>=1) {	// if on checkout page
			for (key in cartAdd) {
				for (var i=0; i<cartAdd[key]; i++)
				{
					addPartNumberToCart(key);
				}
			}
			return false;
		}
		
		var t1Cart={};
		if ($.cookie("t1CartItems")) {
			t1Cart = JSON.parse($.cookie("t1CartItems"));
		}
		for (key in cartAdd) {
			if (t1Cart[key] == undefined) {
				t1Cart[key] = cartAdd[key];
			}
			else {t1Cart[key] += cartAdd[key]*1;}
		}
		$.cookie("t1CartItems",JSON.stringify(t1Cart),cookieOptions);
		
		window.location = "checkout.php?product="+data['checkoutPage'];	// cookies may get lost if we switch from www.tenonedesign to just tenonedesign or the opposite
		return false;
	});
	// CODE FOR THE TWITTER AND NEWS FEED........................................................... //
	
	// $.get("php/handler.php?getNewsItems=<li>|~</li>",function(html){
	// 	$("#sidebarNews ul").html(html);
	// 	$("#sidebarNews ul").children("li:gt(2)").remove();	// remove everything after the first 3 results
	// });
	
	// DISABLED FOR HIGH VOLUME
	// $.ajax({
	// 	url: 'php/handler.php',
	// 	type: 'POST',
	// 	data: "getNewsItems=<li>|~</li>",
	// 	success: function (html, textStatus) {
	// 			$("#sidebarNews ul").html(html);
	// 			$("#sidebarNews ul").children("li:gt(2)").remove();	// remove everything after the first 3 results
	// 		},
	// 	error: function (XMLHttpRequest, textStatus, errorThrown) {
	// 		  $("#sidebarNews ul").html("Check back later");
	// 		},
	// 	timeout: 3000,
	// 	dataType: 'html'
	// });
	$("#sidebarNews ul").html("");
	$(document).on("click", ".loadMoreTwitter", function() {
		loadTwitter($(this).data('searchString'),$(this).data('from'),$(this).data('loadAfter'),$(this).data('number'),$(this).data('destination'));
		$(this).parent().remove();
	});
	// if ($("body#news").length || $("body#press").length) {		// this might actually be the simplest way to detect a certain page...
	// 	loadTwitter('"Pogo%2BSketch"%2BOR%2B"Pogo%2BStylus"%2BOR%2B"Fling%2BJoystick"','',0,6,$('#newsTwitterHits'));
	// 	loadTwitter('','TenOneDesign',0,6,$('#newsTwitterFeed'));
	// }

	// CODE FOR THE CASES PAGE............................................................. //
	$(".casesTypeDiv").click(function() {
		$(this).find(".casesContent").slideToggle();
	})
	
	
	
	// CODE FOR THE APPS PAGE............................................................. //
	
	$("#appGallery").html($("#appGalleryDefault").html());	// fill by default
	
	$(".appBanner").click(function() {
		// fade out existing gallery content, copy appBanner to gallery, animate appBanner as below
		var activeBanner = $(this);
		$("#appGallery").children().fadeOut("slow", function() {
			$("#appGallery").html(activeBanner.clone());
			$(".appBannerClose").click(function() {		// Bind Close Button
				$("#appGallery").html($("#appGalleryDefault").html());
			})
			var content = $("#appGallery").find("div.appBannerExpand");
			if (content.css("width")=="0px") {
				content.animate( {width: "500px"}, 1000,"linear", function() {
					content.children().fadeIn("slow");
				});
			}
			else {
				content.children().hide();
				content.animate( {width: "0px"}, 1000);
			}
		});
	});
	

	
	// FOOTER
	function toggleEmailForm() {
		$(".footerEmailNotificationOverlay").toggleClass("footerEmailNotificationOverlayShow");
		$(".footerSocialIcon").toggleClass("footerSocialIconShow");
	}
	function showEmailForm() {
		$(".footerEmailNotificationOverlay").addClass("footerEmailNotificationOverlayShow");
		$(".footerSocialIcon").removeClass("footerSocialIconShow");
	}
	function hideEmailForm() {
		$(".footerEmailNotificationOverlay").removeClass("footerEmailNotificationOverlayShow");
		$(".footerSocialIcon").addClass("footerSocialIconShow");
	}
	function resetEmailForm() {
		$(".footerEmailNotification input").val("");
		$(".footerEmailNotificationMessage").html("");
		$(".footerEmailNotification input, .footerEmailNotification button").show();
	}
	function hideAndResetEmailForm() {
		hideEmailForm();
		setTimeout(function(){resetEmailForm();},800);
	}
	function showEmailFormMessage(message) {
		showEmailForm();
		$(".footerEmailNotification input, .footerEmailNotification button").hide();
		$(".footerEmailNotificationMessage").html(message);
	}
	$(".footerEmailIcon").click(function() {
		toggleEmailForm();	
		// nice idea, but it messes up mobile safari because it's asynchronous	
		// $(".footerEmailNotification").on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(e){
		//     $(".footerEmailNotification input").focus();
		// });
		return false;
	});
	$(".footerCells").click(function() { hideEmailForm(); });
	$(".footerEmailNotification input").click(function() { return false; }); // stop from from bubbling up to hide it
	
	$(".footerEmailNotificationLink").click(function() {
		$(".footerEmailNotification").toggleClass("footerEmailNotificationOpen");
		return false;
	});
	$(".footerEmailNotificationCancelButton").click(function() {
		$(".footerEmailNotification").removeClass("footerEmailNotificationOpen");
	});

	$(".footerEmailNotificationAddButton").click(function() {
		var parent = $(this).parents(".footerEmailNotification");
		var email = parent.find("input").val();
		var emmaGroupID = $(this).attr("data-list-id")?$(this).attr("data-list-id"):8396;	// default to info list
		var defaultSuccessMessage = "Thanks!  We’ll be in touch soon.";
		var customSuccessMessage = parent.find(".footerEmailNotificationMessage").attr("data-message-success");
		var successMessage = customSuccessMessage?customSuccessMessage:defaultSuccessMessage;
		var formResets = !parent.find(".footerEmailNotificationMessage").attr("data-no-reset");
		
		if (email == "") { toggleEmailForm(); return false; }
		if (!validateEmail(email)) {
			alert("There may be a typo in your email.  Please check and try again.");
			return false;
		}
		showEmailFormMessage("Adding you to the list now...");

		arbitraryServerFunction("addEmailToEmmaGroup",email+"|~"+emmaGroupID,function(data) {
			
			if (data==1) {
				showEmailFormMessage(successMessage);
				if (formResets) {
					setTimeout(function() {hideAndResetEmailForm();},2000);
				}
			}
			else if (data == 2) {
				// could have been a bad address or a duplicate, but we can't tell so we have to give a success message
				showEmailFormMessage(successMessage);	
				if (formResets) {
					setTimeout(function() {hideAndResetEmailForm();},2000);
				}
			}
			else {
				showEmailFormMessage("Nuts!  Looks like we hit an error signing you up.  Email info@tenonedesign.com, and we’ll hook you up with a spot on the list.");	// some unknown failure
				$(".footerEmailNotificationMessage").click(function() {
					hideAndResetEmailForm();
				});
			}
		});
		return false;
	});
	
	// CODE FOR THE CHECKOUT PAGE.......................................................... //
	

	
	
	
	
	$("div#oCartTabDiv").click(function() {
		document.location="/checkout.php";
	});
	
	if($("body#checkout").length>=1 || $("body#cart").length>=1) {
		// position arrow
		// stop initial css transitions for arrow by hiding (should also be hidden in css)
		$("#checkoutSidebarArrow").css("display","none");
	
		// I don't like this approach much.  I had to move the arrow outside of the div to escape the overflow:hidden of the container
		// Container is overflow:hidden to allow floating divs to expand it
		// now the arrow no longer flows with the document, and must be relocated anytime the page size changes.
		$(window).resize(function() {
			// $("#checkoutSidebarArrow").css("display","none");
			// positionIndex = $("div.checkoutSidebarBackground").index();
			// if (positionIndex == -1) positionIndex = 0;	// there may not be a selection for various reasons, so we start at the top
			// var selectedItem = $("div.checkoutSidebarBackground");
			// var baseOffset = $(".checkoutSidebarDiv").offset();
			// var height = $(".checkoutSidebarGroupDiv").eq(0).height();
			// var y = (height+1)*positionIndex+5+baseOffset.top;
			// $("#checkoutSidebarArrow").css("top",y+"px");
			// $("#checkoutSidebarArrow").css("left",(baseOffset.left-7)+"px");
			//
			// $("#checkoutSidebarArrow").show();
		});
		// $(window).resize();
		// fade in first time
		// $("#checkoutSidebarArrow").show();//hide().fadeIn();
	
		$("div.checkoutSidebarGroupDiv").click(function() {		// manage product group 	
			var selection = $(this).children("input").val();
			$(".checkoutSidebarGroupDiv").removeClass("checkoutSidebarBackground");  // this overrides css hover.  use add/remove class methods
			$(this).addClass("checkoutSidebarBackground");
			$(".checkoutPagesPage").hide();
			if (selection=="all") $(".checkoutPagesPage").fadeIn();
			else $("#checkoutPage"+selection).show();
	
			// move the arrow
			// var baseOffset = $(".checkoutSidebarDiv").offset();
			// var positionIndex = $(this).parent().children($(this).nodeName).index($(this));
			// var y = ($(this).height()+1)*positionIndex+5+baseOffset.top;	// where to move the arrow (includes border width)
			// $("#checkoutSidebarArrow").css("top",y+"px");
			// $("#checkoutSidebarArrow").css("left",(baseOffset.left-7)+"px");

			return false
		});
		$(".checkoutItemAddButton").click(function() {		// add things to cart
			var pn = $(this).parents("div.checkoutItemDiv").find("input.checkoutItemPartNumber").val();
			addPartNumberToCart(pn);
			return false
		});

		$("#couponInvite").click(function() {			// operate the coupon code input
			$(this).html("Enter your code here:<br />");
			$(this).css("text-decoration","none");
			$("#couponInput").slideDown(function() {
				$("#couponInput").css("overflow","visible");// so the highlight ring is not clipped
			});
			$("#couponCodeInput").focus();
			return false
		});
		$("#couponCancel").click(function() {
			$("#couponCodeInput").val("");
			$("#couponApply").click();
		});
		
		$("body#checkout #couponApply").click(function() {			// get coupon info
			var code = $.trim($("#couponCodeInput").val());
			$("#couponCodeInput").val(code);	// remove spaces for next time
			if (code=="") {
				$("#couponInvite").html("<a href=''>Have a coupon code?</a>");
				$("#couponInput").slideUp();
				$("#couponExplanation").slideUp();
				$(".checkoutHideThis").click();
				$("#couponDiscount").html("");
				$.cookie("t1CartCoupon","",cookieOptions);
				refreshCart();
				return false;
			}
			$("#couponExplanation").html("<img id=\"couponLoader\" src=\"images/loader_f1f2f6.gif\" alt=\"loading\" />");
			arbitraryServerFunction("getCouponForCode",code,function(data) {
				$("#couponLoader").hide();
				$("#couponDiscount").html(data);
				var discount = JSON.parse(data);
				$("#couponExplanation").html(discount.message).slideDown();
				showBannerMessage($("#couponExplanation").text());
				refreshCart();
			});
			return false;
		});
		
		$("body#cart #couponApply").click(function() {			// get coupon info
			var code = $.trim($("#couponCodeInput").val());
			$("#couponCodeInput").val(code);	// remove spaces for next time
			if (code=="") {
				$("#couponInvite").html("<a href=''>Have a promotional code?</a>");
				$("#couponInput").slideUp();
				$("#couponExplanation").slideUp();
				$(".checkoutHideThis").click();
				$("#couponDiscount").html("");
				$.cookie("t1CartCoupon","",cookieOptions);
				updateCartAnimated(true);
				return false;
			}
			$("#couponExplanation").html("<img id=\"couponLoader\" src=\"images/loader_f1f2f6.gif\" alt=\"loading\" />");
			arbitraryServerFunction("getCouponForCode",code,function(data) {
				$("#couponLoader").hide();
				$("#couponDiscount").html(data);
				var discount = JSON.parse(data);
				$("#couponExplanation").html(discount.message).slideDown();
				showBannerMessage($("#couponExplanation").text());
				$.cookie("t1CartCoupon",$("#couponCodeInput").val(),cookieOptions);
				updateCartAnimated(true);
			});
			return false;
		});
	}
	
	if($("body#checkout").length>=1) {		// restore items to cart
		readCartFromCookies();
		readShippingAndCouponFromCookies();
		refreshCart();
	}
	if($("body#cart").length>=1) {		// restore items to cart
		// console.log("reading from cookies");
		readShippingAndCouponFromCookies();
		updateCartAnimated(false);
	}
	if($("body#checkout").length>=1 || $("body#cart").length>=1) {		// restore items to cart
		if (shippingData["promotionMessage"].length>=1) showBannerMessage(shippingData["promotionMessage"]);
	}
	setShippingIfNotSetAndInUS();
	$("body#checkout #checkoutCartShippingSelect").change(function() {			// run every time shipping is updated
		var temp = shippingData[$(this).val()].price*1;
		$("#checkoutCartShippingPrice").text(temp.toFixed(2));	// essential to round here because .001 = free shipping to evade cart checker
		refreshCart();
	});
	$("body#cart #checkoutCartShippingSelect").change(function() {			// run every time shipping is updated
		var temp = shippingData[$(this).val()].price*1;
		$("#checkoutCartShippingPrice").text(temp.toFixed(2));	// essential to round here because .001 = free shipping to evade cart checker
		$.cookie("t1CartShipping",$("#checkoutCartShippingSelect").val(),cookieOptions);
		updateCartAnimated(true);
	});
	$("#checkoutCartShippingDetails,#checkoutCartHelpDiv").click(function() {		// show the help div
		$("#checkoutCartHelpDiv").slideToggle();
		return false;
	});
	$(document).on("click", ".checkoutHideThis", function() {	// for the banner notice of discount
		$(this).parent().slideUp(function() {$(window).resize();});
	});
	
	
	// DISABLE ORDERING HERE FOR NOW
	$(".checkoutCartNowButton").click(function() {		// Check and send the cart to paypal
		if (orderingDisabled) {		
			alert("Our ordering system is down for a few hours.  This notice will go away when it's back up.  You'll need to reload the page to check, but don't worry, it'll save your cart.  Sorry for any inconvenience!");
			return false;
		}
		submitCart();
	});
	$(".altTarget").click(function() {
		// test = true;
		// submitCart();
		
	});
	
	
	$(".paypalButton").click(function() {		// Check and send the cart to paypal
		$(".paypalSubmit").submit();
	});
	$("#couponCodeInput").keydown(
	  function(e){
		var key = e.keyCode || 0;
		if (key == 13) {		// if it's the enter key
    		$("#couponApply").click();
			return false	// TODO: doesn't seem to block form submission in firefox
  		}
	  }
	);

});

// Overlay (base html is included with the header)
function showOverlayWithTitleContent(title,content) {
	$(".genericOverlay .t1OverlayTitle").prepend(title);
	$(".genericOverlay .t1OverlayContent").html(content);
	showOverlay(content);
}
function showOverlayWithContent(content) {
	$(".genericOverlay .t1OverlayContent").html(content);
	showOverlay();
}
function showOverlay() {
	$(".genericOverlay").fadeIn();
	$(".genericOverlay .t1RemoveButton").on("click",function() {
		$(this).parents(".t1Overlay").fadeOut();
	});
}

function hideOverlayAnimated(animated) {
	if (animated) $(".genericOverlay").fadeOut();
	else $(".genericOverlay").hide();
}


function arbitraryServerFunction(functionName,params,callback) {
	$.ajax({
		url: '/php/handler.php',
		type: 'POST',
		timeout: 0,
		dataType: 'html',
		data: functionName+"="+params,
		success: function (data, textStatus) {
			if (typeof callback == "function") { callback.call(this, data); }
		}
	
	});
}
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
function validateEmail(email) {
	return /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i.test(email);
}
function retinaDisplay() {
	if (pixelRatio() > 1) return true;
	return false;
}

function pixelRatio() {
	
	// Set pixelRatio to 1 if the browser doesn't offer it up.
	var pixelRatio = !!window.devicePixelRatio ? window.devicePixelRatio : 1;
	return pixelRatio;
	
}

function replaceImagesWithRetina(imageObjects) {
	
	imageObjects.each(function(index) {

		domWidth = $(this).get(0).width;
		domHeight = $(this).get(0).height;
		var newSource = $(this).attr('src').replace(".","_2x.");
	
		 // console.log($(this).attr('src')+domWidth);
		$(this).attr("src",newSource);
		$(this).attr("width",domWidth);
		$(this).attr("height",domHeight);
	});
}
function sizeIsUndefinedInCSSForElement(el) {
	el.addClass("default_width_check");
	var undefinedWidth = (el.width() == 12345);
	var undefinedHeight = (el.height() == 12345);
	// console.log("undefinedWidth " + undefinedWidth + " "+el.attr('src') + el.width());
	// console.log("undefinedHeight " + undefinedHeight + " "+el.attr('src') + el.height());
	el.removeClass("default_width_check");
	return (undefinedWidth && undefinedHeight);
}
function viewportClass() {
    var tag = window.getComputedStyle(document.body,':after').getPropertyValue('content');
    tag = tag.replace( /"/g,'');   // Firefox bugfix
    return tag;
};
function quantizeToInterval(x,interval) {
	return Math.ceil(x/interval) * interval;
}
function replaceSLIRImagesWithRetina(imageObjects) {	
	screenPixelRatio = pixelRatio();
	imageObjects.each(function() {
		var src = $(this).attr('src');

		// console.log($(this));
		var isInlineThumb = $(this).hasClass("inlineThumb");
		if (src && (src.indexOf("/slir") != -1) || isInlineThumb) {	// make sure it's a slir-enable image

			// get image dimensions from dom, even if hidden
			domWidth = this.width;
			domHeight = this.height;
			// console.log("source,w,h: "+src+" "+domWidth+" "+domHeight);
			pixelDensity = (this.naturalWidth / this.width).toFixed(3);
			// do we need to act?
			if (pixelDensity < screenPixelRatio * percentOfScreenPixelRatioThatIsOK) {
				// console.log("replacing "+src);
				newWidth = quantizeToInterval(domWidth*screenPixelRatio,imageSizeQuantizationInterval);
				newHeight = quantizeToInterval(domHeight*screenPixelRatio,imageSizeQuantizationInterval);
				
				var newSource = src.replace(/\/w[0-9]+/i,"/w" + newWidth ).replace(/h[0-9]+/i,"h" + newHeight);
				if (isInlineThumb) {
					var quality = this.getAttribute("data-slir-quality");
					var path = this.getAttribute("data-slir-path");
					newSource = "/php/slir/w" + newWidth + "-q" + quality + "/" + path;
					var loadStartTimestamp = Date.now();
					this.onload = function() {
						// console.log("onload fired for "+$(this).attr("src"));
						var loadTime = Date.now() - loadStartTimestamp;
						// console.log(path+" load time: "+loadTime);
						var imageWasCached = loadTime < 100;	// TODO:  Pretty sure this is useless
						if (imageWasCached) $(this).css('-webkit-transition','').css('transition','');
						$(this).css('-webkit-filter','blur(0)').css('filter','blur(0)');
					};
				}
				

				$(this).attr('src', newSource);
			
				// is the width or height is defined in any css file? If not, the size should be constrained here as a fallback.
				if (sizeIsUndefinedInCSSForElement($(this))) {
					$(this).css('max-width',domWidth);
					$(this).css('max-height',domHeight);
				}
			}
		}
	});	
}
function scrollToElement(element, completionHandler, topOffset, scrollTime) {
	topOffset = (typeof topOffset === "undefined") ? 40 : topOffset;
	scrollTime = (typeof scrollTime === "undefined") ? 1500 : scrollTime;
	if (element.offset())
	{
		$('html, body').animate({ scrollTop: element.offset().top - topOffset }, scrollTime,function(){
	 	   if (typeof completionHandler == "function") { completionHandler.call(this); }
		});
	}
}
function scrollToAnchorAndHighlightNext(anchor)
{		
	scrollToAnchor(anchor,function() {		
		// color faqs a sunny yellow
		$("a[name='"+anchor+"']").next().css("background-color","rgba(255, 154, 76, 0.62)");
	},120);
}
function scrollToAnchor(anchor, completionHandler, topOffset) {
	return scrollToElement($("a[name="+anchor+"]"), completionHandler, topOffset);
}
function isElementWithinParent(el) {
    if (el instanceof jQuery) {
        el = el[0];
    }
	var rect = el.getBoundingClientRect();
	var parentRect = el.parentNode.getBoundingClientRect();
	return (
		rect.top >= parentRect.top &&
		rect.left >= parentRect.left &&
		rect.bottom <= parentRect.bottom &&
		rect.right <= parentRect.right
	);
}
function actionForElementCenterEnterViewport(element, action) {
	var actionIdentifier = (Math.random().toString(36)+'00000000000000000').slice(2, 10+2);
	$(window).on("scroll."+actionIdentifier, function(){
		if (globalScrollingTriggerDisable) return;
		if(isElementCenterInViewport(element)){
			// console.log("triggered scrolling for identifier "+actionIdentifier);
			var keepActionEnabled = false; // only require return value for rare circumstance
			if (typeof action == "function") { keepActionEnabled = action.call(); }
			if (!keepActionEnabled) {
				$(window).off("scroll."+actionIdentifier);
			}
			
		}
	});

	// trigger on reload
	$(window).trigger( "scroll.localPage" );
}
function isElementCenterInViewport(el) {
    if (el instanceof jQuery) {
        el = el[0];
    }
	var rect = el.getBoundingClientRect();
	var centerX = (rect.right-rect.left)/2 + rect.left;
	var centerY = (rect.bottom-rect.top)/2 + rect.top;
	// console.log("top:"+rect.top+" bottom:"+rect.bottom+" centerY:"+centerY);
	return (
        centerY >= 0 &&
        centerX >= 0 &&
        centerY <= (window.innerHeight || document.documentElement.clientHeight) &&
        centerX <= (window.innerWidth || document.documentElement.clientWidth)
    );
}
function isElementInViewport (el) {
    if (el instanceof jQuery) {
        el = el[0];
    }
	var rect = el.getBoundingClientRect();
	return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
    );
}

function loadTwitter(searchString,from,loadAfter,number,destination) {
		var loadAfter = loadAfter?loadAfter:0;
		 //alert("page = "+(loadAfter/number+1));
		// alert('url: php/handler.php?proxy=http%3A%2F%2Fsearch.twitter.com%2Fsearch.atom%3Fq%3D"Pogo%2BSketch"%2BOR%2B"Pogo%2BStylus"%26rpp%3D'+number+'%26page%3D'+(loadAfter/number+1));
		jQuery.getFeed({
	//		url: 'php/proxy.php?url=http%3A%2F%2Fwww.tweetscribe.com%2Ffeed.php%3Fuser_name%3Dtenonedesign',	// other url
			url: 'php/handler.php?proxy=http%3A%2F%2Fsearch.twitter.com%2Fsearch.atom%3Fq%3D'+searchString+'%26from%3D'+from+'%26rpp%3D'+number+'%26page%3D'+(loadAfter/number+1),
	        success: function(feed) {
	            var html = '';
	            for(var i = 0; i < feed.items.length; i++) {
	                var item = feed.items[i];
					html += '<div class="newsLineDiv"><a href="'+item.link+'"><img src="'+item.image+'" alt="" /></a>'+item.description+'</div>';
	            }	
					html += '<div class="newsLineDiv newsLineButtonHolder"><div id="" class="t1Button loadMoreTwitter">Load More</div></div>';
				//	alert(html);
				if (loadAfter>0) destination.append(html);
	            else destination.html(html);
				var button = destination.find(".loadMoreTwitter");
	            button.data("loadAfter",loadAfter+number);
	            button.data("searchString",searchString);
	            button.data("from",from);
	            button.data("destination",destination);
	            button.data("number",number);
	        }    
	    });
}

// Video support

// load youtube api
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// define player.  will be loaded on click event.
var playerX;

function onYouTubeIframeAPIReady() {
}
function onPlayerError(event) {
	// console.log("error number "+event.data);
}
function onPlayerReady(event) {
	// var target = event.target.a.id;
	// console.log(target+" player ready");
	//event.target.playVideo();
}
function onPlayerStateChange(event) {
	// console.log("player state change (single argument): "+event.data);
	switch(event.data) {
		case YT.PlayerState.ENDED:
			$(".pdVideoDiv").click();
			break;
		case YT.PlayerState.PLAYING:
			break;
	}
}
function stopAndDestroyVideo() {
	if (playerX) {
		playerX.stopVideo();
		playerX.destroy();
		playerX = null;
	}
}
// end video support



// function onPlayerStateChange(player,state) {
// 	console.log("player state change (multiple arguments): "+state);
// 	switch(state) {
// 		case 0:	// ended
// 			player.siblings().fadeIn();
// 			break;
// 		case 1:	// started
// 			player.siblings('.videoStillDiv').fadeOut(1200);
// 			break;
// 	}
// }
// function onYouTubePlayerReady(playerId) {
// 	player = document.getElementById(playerId);
// 	if (!player) $("#"+playerId+"Div").siblings().remove();	// if swfobject didn't load for some reason, remove fancy stuff
// 	else player.addEventListener("onStateChange",playerId+"StateChange");
// 	var readyCallback = window[playerId+"Ready"];
// 	if (typeof readyCallback == "function") { readyCallback.call(); }
//
// }



// HTML5 Video Control
function videoShouldTryAutostarting() {
	return viewportGreaterThan(requiredWidthForAutostartingVideo);
}
function viewportGreaterThan(limit) {
	return (document.documentElement.clientWidth >= limit);
}
function primeVideoForPlaybackOnMobileSafari(video) {

	// the priming function starts then pauses the video so it will later be responsive to scrolling or any other event.
	// touchstart in 9.0 stopped working, but restored in ~9.1
	// discussion: https://bugs.webkit.org/show_bug.cgi?id=149367
	// added touchend but if fix in 9.1 is reverted, touchend will be unable to trigger video either because it'll be considered part of a scroll gesture and not a "explicit user gesture"

	$(window).on("touchstart."+video.id+" touchend."+video.id, function(){
		$(window).off("touchstart."+video.id);
		$(window).off("touchend."+video.id);
		// console.log("priming video");
		video.play();
		// console.log("video is playing: "+!video.paused);
		video.pause();
	});
}
function startVideoWhenElementCenterEntersViewport(video,element) {	
	
	actionForElementCenterEnterViewport(element, function() {
		var keepActionEnabled = false;
		if (deviceSupportsInlineVideo == true) {
			playVideoOnTablet(video);
			if (video.paused) {
				// playback didn't work.  keep waiting for more scroll events and hope that video gets primed by a touch on mobile safari soon
				keepActionEnabled = true;	
			}
		}
		return keepActionEnabled;
	});

	return;
	
	$(window).on("scroll."+video.id, function(){
		if (globalScrollingTriggerDisable) return;
		if(isElementCenterInViewport(element)){
			$(window).off("scroll."+video.id);
			playVideo(video);
		}
	});
	$(window).on('touchmove touchstart touchend', function(e) {
		if (globalScrollingTriggerDisable) return;
		if(isElementCenterInViewport(element)){
			globalScrollingTriggerDisable = true;
			if (deviceSupportsInlineVideo == true) { playVideoOnTablet(video); }
		}
	});
	$(window).trigger( "scroll."+video.id );

}

function setupVideo(video) {
	primeVideoForPlaybackOnMobileSafari(video);
	
	// this fixes a webkit bug where video goes blank with preload auto and a poster
	// http://stackoverflow.com/questions/13492198/video-disappears-when-poster-attribute-and-preload-is-defined
	// having a hard time reproducing right now.  There was also something related to scroll position.
	video.addEventListener("play",function(e) {
	        if (this.getAttribute('controls') !== 'true') {
	            this.setAttribute('controls', 'true');
	        }
	        this.removeAttribute('controls');
			
			// separately, remove video controls for iPads
			
			$(".pdrVideoControls").hide();
	});
	

}

// this is mostly for iOS devices that will not start playing after a scroll or user touch
function showPlayButtonIfVideoStartFailed(video) {
	if (video.currentTime == 0 && !video.ended) {
		$(".pdrVideoControls").addClass("pdrVideoControlsShow");
	}
}
function bindVideoCompletionHandler(video,completionHandler) {
	// note: attaching with video.onended = function doesn't work in Safari 5.1 and I have no idea why
	video.addEventListener("ended",function(e) {
	   $(".pdrimagevideoend").addClass("pdrimagevideoendshow");
	   if (typeof completionHandler == "function") { completionHandler.call(this); }
	},false);
}
function bindRestartOfVideoToSelectorStringDelayAction(video,selectorString,delay,action) {
	$(document).on("click", selectorString, function() {
		$(video).removeClass("pdrvideoshow");
		$(".pdrimagevideoend").removeClass("pdrimagevideoendshow");
		if (typeof action == "function") { action.call(this); }
		setTimeout(function() {playVideoOnTablet(video)},delay);
	});
}
function showFirstFrameOfVideo(video) {
	$(video).addClass("pdrvideoshow");
	video.currentTime = 0;
	video.play();
	video.pause();
}
function playVideoOnTablet(video) {
	playVideo(video);
	video.play();	// trigger manually because setTimeout doesn't work on iPad for video
}
function playVideo(video) {
	// console.log(video.currentTime);
	if (video.currentTime > 0) video.currentTime = 0;	// if() stops crash in iOS 6 when video is "not usable"
	$(video).addClass("pdrvideoshow");
	setTimeout(function() {video.play();},500);
	setTimeout(function() {showPlayButtonIfVideoStartFailed(video);},1000);
}


// Generic animation handling
function startAnimation(animation) {
	setTimeout(function() {animationTick(animation)},animation['startDelay']);
}
function animationTick(animation) {
	if (animation["step"] == animation["steps"].length) {	// if we're done
		if (typeof animation["completionHandler"] == "function") { animation["completionHandler"].call(this); }
		if (animation["repeat"]) {
			animation["step"] = 0;
		}
	}
	var currentStep = animation["steps"][animation["step"]];
	if (typeof animation["stepHandler"] == "function") { animation["stepHandler"].call(currentStep,animation); }
	animation["step"]++;
	
	setTimeout(function() {animationTick(animation)},currentStep["interval"]);
}
function widthOfRenderedStringInDiv(string,div) {
	div.clone().css("visibility","hidden").css("width","auto").css("white-space","nowrap").css("display","inline-block").addClass("textRenderTestDiv").insertAfter(div);
	$(".textRenderTestDiv").html(string);
	var width = $(".textRenderTestDiv")[0].clientWidth + 1;
	$(".textRenderTestDiv").remove();
	return width;
}


// SVG Line animation methods
function animateLineInContainerWidthFromPointToPointWidthLinecapColorDurationDelayEasing(container,cwidth,x1,y1,x2,y2,width,linecap,color,duration,delay,easing) {
	// scaled svg that covers container and scales with it
	var ratio = container.clientHeight / container.clientWidth;
	// console.log("ratio: "+ratio);
	var svg = SVGA.createSVGElementInContainer(container, cwidth, cwidth * ratio, 'position:absolute; width: 100%; left: 0; top: 0; z-index: 33;');
	var line = SVGA.createLineInSVG(svg, x1, y1, x2, y2, width, linecap, color);
	SVGA.animateLine(line,duration,delay,easing);
	return svg;
}
function animateArcInContainerWidthCenterRadiusWidthStartStopClockwiseReverseLinecapColorDurationDelayEasing(container,cwidth,cx,cy,r,width,startAngle,stopAngle,clockwise,reverse,linecap,color,duration,delay,easing) {
	var ratio = container.clientHeight / container.clientWidth;
	var svg = SVGA.createSVGElementInContainer(container, cwidth, cwidth * ratio, 'position:absolute; width: 100%; left: 0; top: 0; z-index: 33;');
	var line = SVGA.createArcInSVG(svg, cx, cy, r, width, startAngle, stopAngle, clockwise, reverse, linecap, color);
	SVGA.animateLine(line,duration,delay,easing);
	return svg;
}
function animateTextInContainerWidthLocationAnchorFontSizeJustificationColorDurationDelayEasing(container,cwidth,x,y,value,anchor,font,size,align,color,duration,delay,easing) {
	var ratio = container.clientHeight / container.clientWidth;
	var svg = SVGA.createSVGElementInContainer(container, cwidth, cwidth * ratio, 'position:absolute; width: 100%; left: 0; top: 0; z-index: 34;');
	var element = SVGA.createTextInSVG(svg, x, y, value, anchor, font, size, align, color);
	SVGA.animateText(element,duration,delay,easing);
	return svg;
}
SVGA = {
	// https://css-tricks.com/svg-line-animation-works/
	createSVGElementInContainer : function(container, width, height, style) {
		var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute('style', style);
		// console.log("style: "+style);
		// svg.setAttribute('width', width);
		// svg.setAttribute('height', height);
		svg.setAttribute('viewBox', "0 0 "+width+" "+height);
		svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
		container.appendChild(svg);
		return svg;
	},
	createTextInSVG : function(svg, x, y, value, anchor, font, size, align, color) {
		var element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		element.setAttribute('x', x);
		element.setAttribute('y', y);
		element.setAttribute('text-anchor', anchor);
		element.setAttribute('font-family', font);
		element.setAttribute('font-size', size);
		element.setAttribute('style', "text-align: "+align+"; opacity: 0;");
		element.setAttribute('fill', color);
		var textNode = document.createTextNode(value);
		element.appendChild(textNode);
		// element.setAttribute('vector-effect', 'non-scaling-stroke');
		svg.appendChild(element);
		return element;
	},
	createCircleInSVG : function(svg, cx, cy, r, w, percent, transform, linecap, color, fillColor) {
		var element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
		element.setAttribute('cx', cx);
		element.setAttribute('cy', cy);
		element.setAttribute('r', r);
		element.setAttribute('stroke-width', w);
		element.setAttribute('transform', transform);
		element.setAttribute('stroke-linecap', linecap);
		element.setAttribute('stroke', color);
		element.setAttribute('fill', fillColor);
		// element.setAttribute('vector-effect', 'non-scaling-stroke');
		svg.appendChild(element);
		return element;
	},
	createArcInSVG : function(svg, cx, cy, r, w, startAngle, stopAngle, clockwise, reverse, linecap, color) {
		var element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		var startX = cx + r * Math.sin(startAngle);
		var startY = cy - r * Math.cos(startAngle);
		var stopX = cx + r * Math.sin(stopAngle);
		var stopY = cy - r * Math.cos(stopAngle);
		var largeArcSweepFlag;
		if (clockwise) {
			// only large if greater than 180
			largeArcSweepFlag = (stopAngle - startAngle) > Math.PI?"1":"0";
		}
		else {
			largeArcSweepFlag = (stopAngle - startAngle) < Math.PI?"1":"0";
		}
		
		var sweepFlag = clockwise;

		var pathString = "M"+startX+" "+startY+" A "+r+" "+r+", 0, "+largeArcSweepFlag+", "+sweepFlag+", "+stopX+" "+stopY;
		element.setAttribute('d',pathString);
		
		element.setAttribute('stroke-width', w);
		element.setAttribute('stroke-linecap', linecap);
		element.setAttribute('stroke', color);
		element.setAttribute('fill', "none");
		element.setAttribute('reverse', reverse);
		// element.setAttribute('style', "opacity: 0;");
		// element.setAttribute('vector-effect', 'non-scaling-stroke');
		svg.appendChild(element);
		return element;
	},
	createLineInSVG : function(svg,x1, y1, x2, y2, w, linecap, color) {
		var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		line.setAttribute('x1', x1);
		line.setAttribute('y1', y1);
		line.setAttribute('x2', x2);
		line.setAttribute('y2', y2);
		line.setAttribute('stroke-width', w);
		line.setAttribute('stroke', color);
		line.setAttribute('stroke-linecap', linecap);
		svg.appendChild(line);
		return line;
	},
	lengthOfLine : function(line) {
		var x1 = line.getAttribute('x1');
		var y1 = line.getAttribute('y1');
		var x2 = line.getAttribute('x2');
		var y2 = line.getAttribute('y2');
		return Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2));
	},
	lengthOfCircle : function(circle) {
		var r = circle.getAttribute('r');
		return Math.PI * 2 * r;
	},
	lengthOfPath : function(path) {
		return path.getTotalLength();
	},
	lengthOfSVGElement : function(element) {
		switch( element.tagName.toLowerCase() ) {
			case 'circle': 
				return this.lengthOfCircle(element);
				break;
			case 'line':
				return this.lengthOfLine(element);
				break;
			case 'path':
				return this.lengthOfPath(element);
				break;
			default:
				return 0;
		}
	},
	forceRedraw: function() {
		var height = document.body.offsetHeight;
	},
	animateLine : function(line,duration,delay,easing) {
		var easing = arguments[3] || "linear";
		var lineStyle = line.getAttribute('style') || "";
		var reverse = line.getAttribute('reverse') || "";
		var strokeWidth = line.getAttribute("stroke-width");
		line.setAttribute("stroke-width",0);
		var length = this.lengthOfSVGElement(line);
		var offset = length;
		// the reversing animation idea came from https://css-tricks.com/animate-to-an-inline-style/
		var animation = (reverse==="1")?"SVGLineAnimationToZeroForReversing":"SVGLineAnimationToZero";
		lineStyle += " stroke-dasharray: "+length+";";
		lineStyle += " stroke-dashoffset: "+offset+";";
		lineStyle += " animation: "+animation+" "+duration/1000+"s "+easing+" forwards;";
		setTimeout(function() {
			line.setAttribute('style', lineStyle);
			line.setAttribute('stroke-width', strokeWidth);
		}, delay);
		setTimeout(function() {	// fallback for IE up to and including 11
			line.style.strokeDashoffset = "0";
		}, delay + duration);
	},
	
	animateText : function(element,duration,delay,easing) {
		var easing = arguments[3] || "linear";				
		this.forceRedraw(); // force redraw to make opacity 0
		var elementStyle = element.getAttribute('style') || "";
		elementStyle += " opacity: 1;";
		elementStyle += " transition-property: opacity;";
		elementStyle += " transition-delay: "+delay / 1000+"s;";
		elementStyle += " transition-duration: "+duration / 1000+"s;";
		elementStyle += " transition-timing-function: "+easing+";";
		element.setAttribute('style', elementStyle);
	},
}
function angleDifference(angle1,angle2) {
	var delta = Math.abs(angle2 - angle1);
	if (delta > Math.PI) {
		delta = 2 * Math.PI - delta;
	}
	console.log("delta: "+delta);
	return delta;	
}
function angleDifferenceGreaterThanThreshold(angle1,angle2,threshold) {
	console.log("threshold: "+threshold);
	return angleDifference(angle1,angle2) > threshold;
}


// anatomy section setup
function anatomySectionPlayerForElementWithTopBottomCallbacks(element,button,drawTop,drawBottom,removeAll) {
	actionForElementCenterEnterViewport(element,function() {
		if (typeof drawTop == "function") { drawTop.call(); }
	});
	element.find('.mjpegPlayer').clipchamp_mjpeg_player(function (wrapperElement, player) {
		// this runs when player is finished forming
		button.on("click",function() {
			if (typeof removeAll == "function") { removeAll.call(); }
			player.play();
		});
		player.setCompletionCallback(function() {
			button.off("click");
			arguments.callee.reversing = arguments.callee.reversing || false;
			arguments.callee.reversing = !arguments.callee.reversing;
			player.pause();
			if (arguments.callee.reversing) {
				if (typeof drawBottom == "function") { drawBottom.call(); }
				button.on("click",function() {
					if (typeof removeAll == "function") { removeAll.call(); }
					player.playReverse();
				});
			}
			else {
				if (typeof drawTop == "function") { drawTop.call(); }
				button.on("click",function() {
					if (typeof removeAll == "function") { removeAll.call(); }
					player.play();
				});
			}
		});
		player.play();
		player.pause();
	});	
}






function addPartNumberToCart(pn) {
	// temporary hack to show message if adding first item to cart
	// if ($("ul.checkoutCartUl").children().length == 0)
	// {
	// 	showBannerMessage("Spring Fling Sale! &nbsp; Add a <span class='obviousLink'><a href='https://tenonedesign.com/fling.php'>fling</a></span> to your cart for only $3.99. &nbsp;<span class='obviousLink'><a href='' data='{\"cartAdd\":{\"T1_FLN2_301\":\"1\"},\"checkoutPage\":\"none\"}' class='addToCart'>Add</a></span>");
	// }
	
	
	var existing = $("ul.checkoutCartUl").find("#checkoutCartItem"+pn);
	if (existing.length>=1) {
		var quantity = existing.find("select");
		if (quantity.val()<30) quantity.val(quantity.val()*1+1);
	}
	else addHTMLToCart("ul.checkoutCartUl",pn);
	refreshCart();
}
function addHTMLToCart(scope,partnumber) {
	
	$(scope).append(''
	+	'<li class="checkoutCartItem" id="checkoutCartItem'+partnumber+'">'
	+	'		<ul class="checkoutCartItemUl">'
	+	'			<li>'+productData[partnumber].description+'</li>'
	+	'			<li class="checkoutCartItemQuantity">qty: '
	+	'	            <select class="checkoutCartItemQuantitySelect" name="">'
	+	'	              <option value="0">0</option>'
	+	'		          <option selected value="1">1</option>'
	+	'	              <option value="2">2</option>'
	+	'	              <option value="3">3</option>'
	+	'		          <option value="4">4</option>'
	+	'	              <option value="5">5</option>'
	+	'	              <option value="6">6</option>'
	+	'	              <option value="7">7</option>'
	+	'		          <option value="8">8</option>'
	+	'	              <option value="9">9</option>'
	+	'	              <option value="10">10</option>'
	+	'		          <option value="11">11</option>'
	+	'	              <option value="12">12</option>'
	+	'	              <option value="13">13</option>'
	+	'		          <option value="14">14</option>'
	+	'	              <option value="15">15</option>'
	+	'	              <option value="16">16</option>'
	+	'		          <option value="17">17</option>'
	+	'	              <option value="18">18</option>'
	+	'	              <option value="19">19</option>'
	+	'		          <option value="20">20</option>'
	+	'	              <option value="21">21</option>'
	+	'		          <option value="22">22</option>'
	+	'	              <option value="23">23</option>'
	+	'	              <option value="24">24</option>'
	+	'	              <option value="25">25</option>'
	+	'	              <option value="26">26</option>'
	+	'	              <option value="27">27</option>'
	+	'	              <option value="28">28</option>'
	+	'	              <option value="29">29</option>'
	+	'	              <option value="30">30</option>'
	+	'	            </select>'
	+	'				<a href="">remove</a></li>'
	+	'			<li class="checkoutCartItemSubtotal">$<span>'+productData[partnumber].price+'</span></li>'
	+	'			<li class="checkoutCartItemPrice hidden">'+productData[partnumber].price+'</li>'
	+	'			<li class="checkoutCartItemName hidden">'+productData[partnumber].name+'</li>'
	+	'			<li class="checkoutCartItemSoftware hidden">'+productData[partnumber].software+'</li>'
	+	'			<li class="checkoutCartItemPartNumber hidden">'+productData[partnumber].partnumber+'</li>'
	+	'		</ul>'
	+	'	</li>');
	$(scope).find("li#checkoutCartItem"+partnumber).find("select").val(1);	// force val to fix safari bug
	$(".checkoutCartItemQuantity a").unbind();
	$(".checkoutCartItemQuantity a").click(function() {		// bind removal function
		var item = $(this).parents("li.checkoutCartItem");
		item.slideUp("fast",function(){
			item.remove();
			refreshCart();
		});
		return false
	})
	$("li.checkoutCartItem").find("select").unbind();
	$("li.checkoutCartItem").find("select").change(function() {		// bind update function
		if ($(this).val()==0) $(this).next().click();
		refreshCart();
		return false
	})

}
function setShippingIfNotSetAndInUS() {
	var t1CartShipping = $.cookie("t1CartShipping");
	if (!t1CartShipping) {
		$.getJSON('https://api.wipmania.com/jsonp?callback=?', function (data) { 
		  // console.log('Latitude: ' + data.latitude +
		  //       '\nLongitude: ' + data.longitude +
		  //       '\nCountry: ' + data.address.country); 
			if (data.address.country == "United States") {
				$.cookie("t1CartShipping","FC",cookieOptions);
			}
		});
	}

}
function readShippingAndCouponFromCookies() {
	var t1CartShipping = $.cookie("t1CartShipping");	// offload cookies here b/c addPartNumberToCart clears them
	var t1CartCoupon = $.cookie("t1CartCoupon");
	// console.log(t1CartCoupon);
	// console.log(t1CartShipping);
	if (t1CartShipping && t1CartShipping != "null") {
		$("#checkoutCartShippingSelect").val(t1CartShipping); // restore shipping to cart
		$("#checkoutCartShippingPrice").text((shippingData[t1CartShipping].price*1).toFixed(2));	// make it visible
	}
	if (t1CartCoupon &&  t1CartCoupon != "null") { 	// replace any coupon
		$("#couponCodeInput").val(t1CartCoupon);
		$("#couponInvite").click();
		$("#couponApply").click();
	}
}
function readCartFromCookies() {
	
	if ($.cookie("t1CartItems")) {
		var cart = JSON.parse($.cookie("t1CartItems"));
		for (key in cart) {
			var itemNumber = key;	// key is mutated somehow in addPartNumberToCart, so it must be captured.
			var itemQuantity = cart[itemNumber];
			for(i=0;i<itemQuantity;i++) {
				if (productData[itemNumber] != undefined && productData[itemNumber].orderable=="1") {	// avoid adding unorderable things to cart
				    addPartNumberToCart(itemNumber);
				}
  			};
		}
	}
	
}
function makeShippingOptionsWithData(data) {
	var select = $("#checkoutCartShippingSelect");
	var previousValue = select.val();
	select.empty();
	for ( key in data) {
		if (data[key]["display"] == 1) {
			select.append("<option value='"+data[key]["code"]+"'>"+data[key]["name"]+"</option>");
		}
	}
	select.val(previousValue);
}
function refreshCart() {
	
	updateCartAnimated(false);
	var cartQuantity = 0;
	var cartPrice = 0;
	var cartSoftwareCount = 0;	// detect how much software is in cart
	var cartCookieContents={};	// new associative array
	var cartLineItemCount=0;
	// for promotion
	var promotionActive = 0;
	var flingCount = 0;
	var oldCouponExplanation=$("#couponExplanation").html();
	var oldCouponDiscount=$("#couponDiscount").html();
	var oldCouponInput=$("#couponCodeInput").val();
	$("li.checkoutCartItem").each(function() {
		var quantity = $(this).find("select").val()*1;
		var price = $(this).find("li.checkoutCartItemPrice").text()*1;
		var software = $(this).find("li.checkoutCartItemSoftware").text()*1;
		var subtotal = (quantity*price).toFixed(2);
		$(this).find("li.checkoutCartItemSubtotal").children("span").text(subtotal);
		cartPrice += subtotal*1;
		cartQuantity += quantity;
		cartSoftwareCount += software;
		cartCookieContents[convertDashesToUnderscore($(this).find("li.checkoutCartItemPartNumber").text())]=quantity;
		cartLineItemCount ++;
		// Autograph promotion
		// if ($(this).find("li.checkoutCartItemName").text()=="Pogo Sketch - Silver"
		// 		|| $(this).find("li.checkoutCartItemName").text()=="Pogo Sketch - Hot Pink") {
		// 	$("li.checkoutCartItem").each(function() {
		// 		if ($(this).find("li.checkoutCartItemName").text()=="Autograph") {
		// 			promotionActive = 1;
		// 			$("#couponDiscount").html("0,6.95,6.95,<b style=\"color: green\">AandS</b>,00008");
		// 			$("#couponExplanation").html("<b style=\"color: green\">$6.95 has been subtracted from your price.<br />Autograph is now free!</b>");
		// 			$("#couponCodeInput").val("FreeAutographWithSketch");
		// 		}
		// 	});	
		// }
		
		// Count the number of flings for promotion
		var name = $(this).find("li.checkoutCartItemName").text();
		if (name == "Fling Game Controller - Ice" || name == "Fling Game Controller - Ninja" || name == "Fling Game Controller - Ultraviolet") {
			flingCount += quantity;			
		}

	});	

// Fling Promotion start	
	var discount = 0; //Math.floor(flingCount/2)*7.49;
	
	if (discount>0) {	// if promotion is active
		promotionActive = 1;
		refreshCart.promotionWasActive = 1;
		$(".checkoutHideThis").click();
		$("#couponDiscount").html("0,"+discount+","+discount+",Fling30,00008");
		$("#couponExplanation").html("Fling pre-order discount!<br />$"+discount+" has been subtracted from your price.");
		$("#couponCodeInput").val("Fling30");
		// console.log("promotion active");
	}
	else if (refreshCart.promotionWasActive) {	// if transitioning to off state (avoiding race condition on coupon)
		refreshCart.promotionWasActive = 0;
		// remove and hide coupon
		$("#couponExplanation").html("");
		$("#couponDiscount").html("");
		$("#couponCodeInput").val("");
		// restore from cookie if possible
		var t1CartCoupon = $.cookie("t1CartCoupon");
		if (t1CartCoupon) {
			$("#couponCodeInput").val(t1CartCoupon);
			$("#couponInvite").click();
			$("#couponApply").click();
		}
		// console.log("promotion inactive");
	}
// Fling promotion end
	
	if (cartQuantity==1) $(".checkoutCartCounter").text(cartQuantity+" item:");
	else if (cartQuantity>1) $(".checkoutCartCounter").text(cartQuantity+" items:");
	else $(".checkoutCartCounter").text("Cart is empty");

	reduction = calculateDiscount(cartPrice,$("#couponDiscount").text());
	reduction = (reduction*1).toFixed(2);	// round to cent
	$("#couponPaypal").text(reduction);	// store for Paypal submit
		// if (reduction>0) $("#couponDisplay").text("-$" + reduction + " ");	// display if nonzero
		// else $("#couponDisplay").text("");
	var cartShipping = $("#checkoutCartShippingSelect");
	var cartSoftwareShipping = $("#checkoutCartSoftwareShippingSelect");
	
	if (cartSoftwareCount==cartLineItemCount && cartLineItemCount >0) {	// only software in cart
		cartShipping.hide();
		cartSoftwareShipping.show();
		var cartNewShipping = 0;
		$("#checkoutCartShippingPrice").text(0.00);
	}
	else {
		cartShipping.show();
		cartSoftwareShipping.hide();
		var cartNewShipping = shippingData[cartShipping.val()].price*1;
		$("#checkoutCartShippingPrice").text(cartNewShipping.toFixed(2));
		
		// clone the object so we can modify the clone
		var modifiedShippingData = jQuery.extend(true, {}, shippingData);

		// check for free shipping flag in coupon
		if ($("#couponDiscount").text()) {
			discount = JSON.parse($("#couponDiscount").text());
			if (discount.allows_free_shipping==1) {
				modifiedShippingData['FC'].freeOver = 0;
				modifiedShippingData['FCN'].freeOver = 0;
				modifiedShippingData['FCN'].display = 1;
			}
		}
		
		makeShippingOptionsWithData(modifiedShippingData);

		if ((cartPrice - reduction) >= modifiedShippingData[cartShipping.val()].freeOver*1) {
			$("#checkoutCartShippingPrice").html("&nbsp;<span style='color: green'>Free!</span>");
			cartNewShipping = 0;
		}

		
	}
	cartPrice = cartPrice*1 - reduction;	// minus discount
	// if ((cartQuantity>=1)&&(cartPrice==0)) cartPrice = 0.01;	// cart can only be zero if empty.  Otherwise, Paypal will have a fit.
	// modified prev and next line to allow 0.00.
	if (cartPrice<0) cartPrice = 0.00;
	cartPrice += cartNewShipping;
	$("#checkoutCartTotalPrice").text(cartPrice.toFixed(2));
	if ($("body#checkout").length > 0) { $.cookie("t1CartItems", JSON.stringify(cartCookieContents),cookieOptions); }	// put cart data into cookies
	$.cookie("t1CartShipping",$("#checkoutCartShippingSelect").val(),cookieOptions);
	if (!promotionActive) $.cookie("t1CartCoupon",$("#couponCodeInput").val(),cookieOptions);
	
	showCartNumberInMasthead();
}

function cartQuantityFromCookies() {
	var quantity = 0;
	var t1CartShipping = $.cookie("t1CartShipping");	// offload cookies here b/c addPartNumberToCart clears them
	var t1CartCoupon = $.cookie("t1CartCoupon");
	if ($.cookie("t1CartItems")) {
		var cart = JSON.parse($.cookie("t1CartItems"));
		for (key in cart) {
			quantity += cart[key];	
		}
	}
	return quantity;
}
function showCartNumberInMasthead() {
	cartQuantity = cartQuantityFromCookies();
	$("svg#cart g").css("opacity","0");
	$(".masthead_cart_count").removeClass("masthead_cart_count_singledigits masthead_cart_count_doubledigits");
	$(".masthead_cart_count").html("");
	if (cartQuantity <= 0) {
		$("svg#cart #empty").css("opacity","1");
	}
	else if (cartQuantity <= 9) {
		$("svg#cart #singledigits").css("opacity","1");
		$(".masthead_cart_count").addClass("masthead_cart_count_singledigits");
		$(".masthead_cart_count").html(cartQuantity);
	}
	else {
		$("svg#cart #doubledigits").css("opacity","1");
		$(".masthead_cart_count").addClass("masthead_cart_count_doubledigits");
		$(".masthead_cart_count").html(cartQuantity);
	}
}
function showCheckoutMessage(message) {
	var display = showCheckoutMessage.arguments.length;
	if (display==0) $(".checkoutCartMessageBox").removeClass("checkoutCartMessageBoxHighlighted");
	else $(".checkoutCartMessageBox").html(message).addClass("checkoutCartMessageBoxHighlighted");
}
function showBannerMessage(message) {
	// if visible, wait a bit for it to be read, close it, then open with new message
	if ($(".couponExplanationBanner:visible").length>=1) {
		$(".couponExplanationBanner").delay(1000).slideUp(function() {
			$(this).html(message+"  <span class='checkoutHideThis'>hide this</span>").slideDown();
			pulseBanner();
		});
	}
	else {
		$(".couponExplanationBanner").html(message+"  <span class='checkoutHideThis'>hide this</span>").slideDown();
		pulseBanner();
	}
	
}
function pulseBanner() {
	$(".couponExplanationBanner").css("background-color","#f8f8f8").animate({ backgroundColor: "#afa" }, 500,"linear" ).animate({ backgroundColor: "#f8f8f8" }, 2200,"linear" );
}
function calculateCartReductionWithDiscountObject(discountObject) {
	var cartDiscount = {};
	
	var t1Cart = readOCartDataFromCookie();
	for (key in t1Cart) {
		cartDiscount[key] = {};
		cartDiscount[key]['price'] = productData[key].price;
		cartDiscount[key]['quantity'] = t1Cart[key];
		cartDiscount[key]['subtotal'] = (productData[key].price * t1Cart[key]);
		cartDiscount[key]['reduction'] = 0;
	}

	// iterate through each discount item and adjust array accordingly
	for (key in discountObject.discount_object) {	
		var discountItem = discountObject.discount_object[key];
		var discountAmount = discountItem.amount;
		var dollarLimit = discountItem.dollarLimit;
		var productString = discountItem.string;
		var cumulativeLimit = discountObject.cumulative_limit;
		
		for(cartKey in cartDiscount) {
			console.log("productString " +convertDashesToUnderscore(productString));
			console.log("cartKey "+cartKey);
			if (convertDashesToUnderscore(productString) == cartKey || productString == "All") {
				var item = cartDiscount[cartKey];
				if (discountItem.discountType == 0) item.reduction = discountAmount * item.quantity;
				else item.reduction = item.price * item.quantity * discountAmount/100;
				if (item.reduction>dollarLimit) item.reduction = dollarLimit;
				cumulativeReduction += item.reduction;	
				console.log(cartKey+" reduction: "+item.reduction);
			}
		}
	}
	
	// sum all reductions into the final number, and limit if necessary.
	var cumulativeReduction = 0;
	for(cartKey in cartDiscount) {
		var item = cartDiscount[cartKey];
		cumulativeReduction += item.reduction;	
	}
	if (cumulativeReduction > cumulativeLimit) cumulativeReduction = cumulativeLimit;
	// console.log("Cumulative reduction: "+cumulativeReduction);
	
	return cumulativeReduction;
}
function calculateDiscount(subtotal,discount) {	// todo: check for not a number

	if (subtotal == 0) return 0;
	if (!discount) return 0;
	discount = JSON.parse(discount);
	var reduction = calculateCartReductionWithDiscountObject(discount);
	return roundNumber(reduction,2);
}

function getShippingPromotionLevel() {
	if (cartPrice >35) {
		return 1;
		// promotionActive = 1;
		// $("#couponDiscount").html("0,0,0,<b style=\"color: green\">FreeShip</b>,00009");
		// $("#couponExplanation").html("<b style=\"color: green\">Well done!  Ground Shipping is now free!</b>");
		// $("#couponCodeInput").val("FreeShipOver35");
	}
}
function roundNumber(rnum, rlength) { // Arguments: number to round, number of decimal places
	var newnumber = Math.round(rnum*Math.pow(10,rlength))/Math.pow(10,rlength);
	return newnumber;
}

function checkCart() {
	if ($("body#checkout").length > 0) {
		$("div.checkoutCartShippingDiv").removeClass("checkoutCartShippingDivHighlighted");	// reset
		if ($(".checkoutCartItem").length<1) {showCheckoutMessage("Your cart is empty"); return false}
		if ($("#checkoutCartShippingSelect").val()=="select" && $("#checkoutCartShippingSelect").is(":visible")) {showCheckoutMessage("Please choose a shipping method"); $("div.checkoutCartShippingDiv").addClass("checkoutCartShippingDivHighlighted"); return false}
		// decided not to on 12/15/2014
		// if (!$('#policyCheckbox').is(':checked')) {
		// 	showCheckoutMessage("Please review our ordering policies below.");
		// 	// window.scrollTo(0,500);
		// 	return false
		// }
	}
	else if ($("body#cart").length > 0) {
		$("div.checkoutCartShippingDiv").removeClass("checkoutCartShippingDivHighlighted");	// reset
		if ($.isEmptyObject(readOCartDataFromCookie())) { showCheckoutMessage("Your cart is empty"); return false; }
		if ($("#checkoutCartShippingSelect").val()=="select" && $("#checkoutCartShippingSelect").is(":visible")) {
			showCheckoutMessage("Please choose a shipping method"); 			$("div.checkoutCartShippingDiv").addClass("checkoutCartShippingDivHighlighted");
			return false
		}
	}
	return true
}
function submitCart() {
	if (!checkCart()) return false;
	showCheckoutMessage("Working...");
	var cartInc = 0;
	var highestPrice = 0;
	var highestCartInc = 1;
	var cartSoftwareCount = 0;
	var custom = {};	// create object
	var cart = {}
	var googleAnalyticsCart = [];
//	custom['cart']=cart;	// prepare cart
	$("input.dynamicInput").remove();
	
	// branch for new and old carts
	if ($("body#checkout").length > 0) {
		$(".checkoutCartItem").each(function() {
			cartInc++;
			var itemQuantity = $(this).find(".checkoutCartItemQuantitySelect").val();
			var itemName = $(this).find(".checkoutCartItemName").text();
			var itemNumber = $(this).find(".checkoutCartItemPartNumber").text();
			var itemPrice = $(this).find(".checkoutCartItemPrice").text();
			var software = $(this).find("li.checkoutCartItemSoftware").text()*1;
			$(".paypalSubmit").append("<input type=\"hidden\" name=\"item_name_"+cartInc+"\" class=\"dynamicInput\" value=\""+itemName+"\">"
				+ "<input type=\"hidden\" name=\"item_number_"+cartInc+"\" class=\"dynamicInput\" value=\""+itemNumber+"\">"
				+ "<input type=\"hidden\" name=\"amount_"+cartInc+"\" class=\"dynamicInput\" value=\""+itemPrice+"\">"
				+ "<input type=\"hidden\" name=\"quantity_"+cartInc+"\" class=\"dynamicInput\" value=\""+itemQuantity+"\">");
			$("input[name='quantity_"+cartInc+"']").val(itemQuantity);		// force value because safari remembers old quantity after hitting 'back' to get to this page, even when removed and reentered.  value must be overwritten.
			$("input[name='item_name_"+cartInc+"']").val(itemName);
			$("input[name='item_number_"+cartInc+"']").val(itemNumber);
			$("input[name='amount_"+cartInc+"']").val(itemPrice);
			var cartArray = {}
			cart[cartInc-1]=cartArray;
			cart[cartInc-1]['name']=itemName;
			cart[cartInc-1]['quantity']=itemQuantity;
			cart[cartInc-1]['number']=itemNumber;
			cart[cartInc-1]['price']=itemPrice;
			if ((itemPrice*itemQuantity)>highestPrice) {
				highestCartInc = cartInc;
				highestPrice = (itemPrice*itemQuantity);
			};
			cartSoftwareCount += software;
		});
	}
	else if ($("body#cart").length > 0) {
		
		var t1Cart = readOCartDataFromCookie();
		var subtotal = 0;
		var cartPrice = 0;
		var cartSoftwareLineItemCount = 0;
		var cartLineItemCount = 0;
		$(".cartCart").find(".cartCartItem").addClass("cartDeleteItemByDefaultFlag");
		for (key in t1Cart) {
			cartInc++;
			var itemQuantity = t1Cart[key];
			var itemName = productData[key].name;
			var itemNumber = productData[key].partnumber;
			var itemPrice = productData[key].price;
			var software = productData[key].software * 1;
			var expectedShipDate = productData[key].expshipdate;
			
			$(".paypalSubmit").append("<input type=\"hidden\" name=\"item_name_"+cartInc+"\" class=\"dynamicInput\" value=\""+itemName+"\">"
				+ "<input type=\"hidden\" name=\"item_number_"+cartInc+"\" class=\"dynamicInput\" value=\""+itemNumber+"\">"
				+ "<input type=\"hidden\" name=\"amount_"+cartInc+"\" class=\"dynamicInput\" value=\""+itemPrice+"\">"
				+ "<input type=\"hidden\" name=\"quantity_"+cartInc+"\" class=\"dynamicInput\" value=\""+itemQuantity+"\">");
			$("input[name='quantity_"+cartInc+"']").val(itemQuantity);		// force value because safari remembers old quantity after hitting 'back' to get to this page, even when removed and reentered.  value must be overwritten.
			$("input[name='item_name_"+cartInc+"']").val(itemName);
			$("input[name='item_number_"+cartInc+"']").val(itemNumber);
			$("input[name='amount_"+cartInc+"']").val(itemPrice);
			var cartArray = {}
			cart[cartInc-1]=cartArray;
			cart[cartInc-1]['name']=itemName;
			cart[cartInc-1]['quantity']=itemQuantity;
			cart[cartInc-1]['number']=itemNumber;
			cart[cartInc-1]['price']=itemPrice;
			cart[cartInc-1]['expshipdate']=expectedShipDate;
			if ((itemPrice*itemQuantity)>highestPrice) {
				highestCartInc = cartInc;
				highestPrice = (itemPrice*itemQuantity);
			};
			cartSoftwareCount += software;
			
			googleAnalyticsCart.push({
				'name': itemName,
				'id': itemNumber,
				'price': itemPrice,
				'brand': 'Ten One Design',
				// 'category': software?"software":"hardware",
				'quantity': itemQuantity
			});
		}
		
		
	}

	$(".paypalSubmit").append("<input type=\"hidden\" name=\"num_cart_items\" class=\"dynamicInput\" value=\""+cartInc+"\">"
		+ "<input type=\"hidden\" name=\"mc_gross\" class=\"dynamicInput\" value=\""+$("#checkoutCartTotalPrice").text()+"\">");
	$("input[name='num_cart_items']").val(cartInc);
	$("input[name='mc_gross']").val($("#checkoutCartTotalPrice").text());
	$(".paypalSubmit").append("<input type=\"hidden\" name=\"total\" value=''>");	// for new cart
	$("input[name='total']").val($("#checkoutCartTotalPrice").text());	// for new cart
	$("input[name='shipping_1']").val($("#checkoutCartShippingPrice").text());
	$(".paypalSubmit").append("<input type=\"hidden\" name=\"tax\" value=''>");	// for new cart (not used)
	$(".paypalSubmit").append("<input type=\"hidden\" name=\"shippingPrice\" value=''>");	// for new cart
	$("input[name='shippingPrice']").val($("#checkoutCartShippingPrice").text());	// for new cart
	custom['refid']=refid;	// store referral
//	custom['order_number']='';	// placeholder - removed because space is limited in paypal custom field
	custom['coupon_code']=$("#couponCodeInput").val();
	custom['coupon_discount']=$("#couponDiscount").html();
	custom['coupon_total']=$("#couponPaypal").text();
	custom['software_only']=(cartSoftwareCount==cartInc);
	if (custom['software_only']) custom['shipping_code']="EMAIL";
	else custom['shipping_code']=$("#checkoutCartShippingSelect").val();
	
	// promoting custom variable to first-class citizens.  Paypal shouldn't mind seeing them come through for a bit until we switch to the new system and discontinue custom
	$(".paypalSubmit").append("<input type=\"hidden\" name=\"refid\" value=''>");
	$("input[name='refid']").val(refid);
	$(".paypalSubmit").append("<input type=\"hidden\" name=\"couponCode\" value=''>");
	$("input[name='couponCode']").val($("#couponCodeInput").val());
	$(".paypalSubmit").append("<input type=\"hidden\" name=\"couponDiscount\" value=''>");
	$("input[name='couponDiscount']").val($("#couponDiscount").html());
	$(".paypalSubmit").append("<input type=\"hidden\" name=\"couponTotal\" value=''>");
	$("input[name='couponTotal']").val($("#couponPaypal").text());
	$(".paypalSubmit").append("<input type=\"hidden\" name=\"softwareOnly\" value=''>");
	if (cartSoftwareCount==cartInc) $("input[name='softwareOnly']").val("1");	// if this were an array, I could actually do a boolean
	$(".paypalSubmit").append("<input type=\"hidden\" name=\"shippingCode\" value=''>");
	if (cartSoftwareCount==cartInc) $("input[name='shippingCode']").val("EMAIL");
	else $("input[name='shippingCode']").val($("#checkoutCartShippingSelect").val());
	
	
	$(".paypalSubmit").append("<input type=\"hidden\" name=\"custom\" value=''>");
	$("input[name='custom']").val(JSON.stringify(custom));	// two-step process keeps safari from caching value (why?!)
	$(".paypalSubmit").append("<input type=\"hidden\" name=\"cart\" value=''>");
	$("input[name='cart']").val(JSON.stringify(cart));	// 	for new cart
//	$(".copyrightTextBlack").append(JSON.stringify(custom));
	if ($("#couponPaypal").text()>0) {
		var amount_1 = roundNumber($("input[name='amount_"+highestCartInc+"']").val() - $("#couponPaypal").text()/$("input[name='quantity_"+highestCartInc+"']").val(),2);
		if (amount_1 <= 0) amount_1 = 0.00; // this finds the most expensive line item, and subtracts the full card discount from it (adjusted for item quantity)
		// also, if we don't round, paypal will choke on bad javascript precision errors (4.949999999...)
		// If no single line item has enough value, the discount will drop the prices to .01, but no lower.
		// if a $15 discount is split 7 ways, rounding to the cent will cause a 2 cent error.  Wish paypal supported discounts... 
		// OK, so this should go away as soon as we switch to the new paypal flow.  Guess they do support discounts with negative line items
		$("input[name='amount_"+highestCartInc+"']").val(amount_1);
//		alert(highestCartInc+" "+$("input[name='amount_"+highestCartInc+"']").val());
	}
	var shippingCode = $("#checkoutCartShippingSelect").val();

	// temp override for test.  Is it really?  Seems turned on...
	if ($("body").hasClass("checkout_mobile")) $(".paypalSubmit").attr("action","https://www.paypal.com/cgi-bin/webscr?cmd=_-express-checkout-mobile&useraction=commit&token=valueFromSetExpressCheckoutResponse");
	
	if (test) {
		// alert($("input[name='cart']").val());
		// alert($("input[name='custom']").val());
		
		// $(".paypalSubmit").append("<input type=\"hidden\" name=\"dumpPost\" value=''>");
		// $("input[name='dumpPost']").val(1);	// two-step process keeps safari from caching value (why?!)

	}
	if (shippingData[$("#checkoutCartShippingSelect").val()].type=="international") {		
		$(".paypalSubmit").attr("action","https://www.tenonedesign.com/cart_process.php");
		$(".paypalSubmit").attr("method","post");	// I know it defaults to post, but if you hit the back button after doing a get, it's still set to get
	}
	else {
		// redirect allows get variables to be forwarded and translated to post via session
		// solves a problem related to refresh button making that nasty "Are you sure you want to resubmit the form?" message.
		$(".paypalSubmit").attr("action","https://www.tenonedesign.com/cart_redirect.php");	
		$(".paypalSubmit").attr("method","get");
	}
	
	// for free products with free shipping
	if ($("#checkoutCartTotalPrice").text()*1 == 0) {
		// use the same redirect to also solve the refresh button issue.
		// requres redirect to be smart about things and send us to the cart_shipping page.
		$(".paypalSubmit").attr("action","https://www.tenonedesign.com/cart_redirect.php");	
		$(".paypalSubmit").attr("method","get");
	}


	// forgo logging and callback when content blockers kill GTM or GA (ga.create ensures ga is genuine and not a shim)
	if (!(window.google_tag_manager && window.ga && window.ga.create)) {
		console.log("no google tag manager loaded due to content blockers.");
		$(".paypalSubmit").submit();
		return;
	}

	// report checkout step 1 to analytics and submit form
	dataLayer.push({
		'event': 'checkout',
		'ecommerce': {
			'checkout': {
				'actionField': {'step': 2, 'option': $("#checkoutCartShippingSelect").val()},
				'products': googleAnalyticsCart,
			}
		},
		'eventCallback': function() {
			// console.log("callback fired");
			$(".paypalSubmit").submit();
		}
	});
 	
 	return;
}