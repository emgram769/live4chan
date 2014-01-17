var chat = {};
var future_ids = $("<span />");

var posting = false;
var cool_down_timer = 0;
var cool_down_interval;
var admin_mode = false;
var convo_filter_state = "no-filter";

var window_focus = true;
var window_alert;
var blink;
var unread_chats = 0;

var admins = ["!/b/suPrEmE","!KRBtzmcDIw"];
/* if you look at source you are essentially helping out, so have some blue colored trips! --> bluerules, testing */
var default_contribs = ["!7cNl93Dbb6","!9jPA5pCF9c"];
var my_ids = [];
var contribs = default_contribs;

var socket = io.connect('/');

var html5 = false;
try {
    html5 = ('localStorage' in window && window['localStorage'] !== null);
} catch (e) {
    html5 = false;
}

if(html5)
{
    if(false) // set to true to reset local storage to defaults
    {
        localStorage['my_ids'] = "[0]";
        localStorage['contribs'] = "[\"0\"]";
        localStorage['convo'] = "";
        localStorage['name'] = "";
        localStorage['theme'] = "Main";
    }
    my_ids = localStorage['my_ids'];
    if(my_ids)
        my_ids = JSON.parse(my_ids);
    else
        my_ids = [];
        
    contribs = localStorage['contribs'];
    if(contribs)
        contribs = JSON.parse(contribs);
    else
        contribs = default_contribs;
        
    $(document).ready(function() {
        $("#name").val(localStorage['name']);
        $("#convo").val(localStorage['convo']);
        $("#theme_select").val(localStorage['theme']);
        if(!$("#theme_select").val().trim()) $("#theme_select").val("Main");
        get_css($("#theme_select").val());
    });
}

function get_cookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++)
    {
        var c = ca[i].trim();
        if (c.indexOf(name)==0) return c.substring(name.length,c.length);
    }
    return "";
}

function get_css(file) {
    if($('#css_new')) {
       $('#css_new').remove(); 
    }
    var head  = document.getElementsByTagName('head')[0];
    var link  = document.createElement('link');
    link.id   = 'css_new';
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = file;
    link.media = 'all';
    head.appendChild(link);
    scroll();
}

function div_alert(message) {
    var alert_div = document.createElement('div');
    alert_div.setAttribute('class', 'alert_div');
    var button_html = "<button class='alert_button' onclick='$(\".alert_div\").remove();'>Close</button>";
    alert_div.innerHTML = "<div class='alert_message'>"+message.replace(/\r?\n/g, '<br />')+"</div>"+button_html;
    $(alert_div).css({
        position:  'fixed',
        background: 'white',
        width:      '300px',
        bottom:       '160px',
        left:      document.width/2-150,
        border:    '1px black solid',
        zIndex:    1000
    });
    $('.chats:first').append(alert_div);
}

function escapeHTML(str) {
    return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
}

function submit_chat(){
    if(get_cookie("password_livechan")=="") {
        var path = window.location.pathname;
        window.open('/login?page=/', '_blank');
	return false;
        //div_alert("<iframe src='/login?page='+path></iframe>");
    }
    posting = true;
    if(html5)
    {
        localStorage['name'] = $("#name").val();
        localStorage['convo'] = $("#convo").val().replace("General", "");
        localStorage['theme'] = $("#theme_select").val();
    }
    
    if($("#body").val()=="")
        $("#body").val("  ");
    var msg = $("#body").val();
    if(msg.indexOf('//') != 0 && msg.indexOf('/') == 0)
    {
        var cmdend = msg.indexOf(' ');
        if(cmdend <= 0)
            cmdend = msg.length;
        var cmd = msg.substring(1,cmdend).replace("\n",'');
        var param = msg.substring(cmdend + 1, msg.length).replace("\n",'');
        $("#body").val('');
        switch(cmd)
        {
            case "addtryp":
                if(param)
                {
                    contribs.push(param);
                    if(html5) localStorage['contribs'] = JSON.stringify(contribs);
                }
                else
                    div_alert("usage: /addtryp !tripcode");
                break;
            case "remtryp":
                if(param)
                {
                    var idx = contribs.indexOf(param);
                    if(idx > -1)
                    {
                        contribs.splice(idx, 1);
                        if(html5) localStorage['contribs'] = JSON.stringify(contribs);
                    }
                }
                else
                    div_alert("usage: /remtryp !tripcode");
                break;
           case "join":
               if(param)
                    window.open('http://' + document.location.host + '/chat/' + param.replace('/', ''));
               else
                    div_alert("usage: /join /channel");
               break;
            case "help":
            default:
                div_alert(
"/addtryp !tripcode: add emphasis to tripcode\n" +
"/remtryp !tripcode: remove emphasis from tripcode\n" +
"/join /channel: join channel\n" +
"/help: display this text\n\n" +
"CONVERSATIONS\n" +
"==============\n" +
"On this site threads are known as \"conversations\"\n" +
"You can change your active conversation from the default \"General\" in the second text box\n" +
"Setting a conversation allows you filter posts to it by using the dropdown box in the lower right\n\n" +
"SESSIONS\n" +
"==============\n" +
"After logging in by entering a CAPTCHA your session will last for 15 minutes\n" +
"Once your session expires posts won't show for other users until you re-login"
);
        }
        return;
    }
    $("#comment-form").submit();
    
    if(!admin_mode){
        $("#submit_button").prop("disabled",true);
        clear_fields();
        cool_down_timer = 6;
        clearInterval(cool_down_timer);
        cool_down();
        cool_down_interval = setInterval(cool_down,1000);
    } else {
        clear_fields();
    }
    return false;
}

function cool_down(){
    if (cool_down_timer <= 0){
        clearInterval(cool_down_interval);
        $("#cool_down").text("");
        $("#submit_button").prop("disabled",false);
    } else {
        $("#cool_down").text(cool_down_timer);
        $("#submit_button").prop("disabled",true);
        cool_down_timer--;
    }
}

function insert_text_at_cursor(el, text) {
    var val = el.value, endIndex, range;
    if (typeof el.selectionStart != "undefined" && typeof el.selectionEnd != "undefined") {
        endIndex = el.selectionEnd;
        el.value = val.slice(0, el.selectionStart) + text + val.slice(endIndex);
        el.selectionStart = el.selectionEnd = endIndex + text.length;
    } else if (typeof document.selection != "undefined" && typeof document.selection.createRange != "undefined") {
        el.focus();
        range = document.selection.createRange();
        range.collapse(false);
        range.text = text;
        range.select();
    }
}

function notifications(){
    unread_chats++;
    clearInterval(window_alert);
    window_alert = setInterval(function(){
        if (!blink){
            window.document.title = '('+unread_chats+') unread chats';
        } else {
            window.document.title = 'LiveChan';
        }
        blink = !blink;
        
    }, 1500)
}

function quote_click() {
    var container = $('.chats:first'),
    scrollTo = $('#chat_' + $(this).data("dest"));
    $("#autoscroll").prop('checked',false);
    container.scrollTop(
        scrollTo.offset().top - container.offset().top + container.scrollTop()
    );
}

function quote_mouseover() {
    var display = $("#chat_" + $(this).data("dest")).clone();
    display.toggleClass("to_die", true);
    display.css({
        position:  'fixed',
        top:       $(this).position().top + 10,
        left:      $(this).position().left + 10,
        border:    '1px black solid',
        zIndex:    1000
    });
    $('body').append(display);
}

function quote_mouseout() {
    $('.to_die').remove();
}

function setup_quote_links(links) {
    links.text(function() {
        var dest_id = parseInt($(this).data("dest"));
        return ">>" + dest_id + ((my_ids.indexOf(dest_id) > -1) ? " (You)" : "");
    });
    links.click(quote_click);
    links.mouseover(quote_mouseover);
    links.mouseout(quote_mouseout);
}

function generate_post(id) {
    var post = $(
        "<div class='chat' style='opacity:0;'>"
            + "<div class='chat_header'>"
                + "<span class='chat_name'><span class='name_part'/><span class='trip_code'/></span>"
                + "<span class='chat_convo'/>"
                + "<span class='chat_date'/>"
                + "<span class='chat_number'/>"
                + "<span class='chat_refs'/>"
            + "</div><span class='chat_img_cont'/><span class='chat_body'/>"
        + "</div>"
    );
    post.attr("id", "chat_"+id);

    var number = post.find(".chat_number");
    number.text(id);
    number.click(function() {
        insert_text_at_cursor($("#body")[0], ">>"+id+"\n");
    });

    var links = future_ids.find("[data-src='"+id+"']");
    post.find(".chat_refs").append(links);
    links.before(" ");

    post.find(".chat_convo").click(function() {
        $("#convo").val(chat[id].convo);
        apply_filter($('#convo_filter').val());
    });

    return post;
}

function update_chat(data, fast) {
    var id = data.count;
    var new_post = !(id in chat);
    if (new_post) {
        chat[id] = data;
        var post = generate_post(id);
    } else {
        for (key in data) {
            if (chat[id][key] === data[key]) {
                delete data[key];
            } else {
                chat[id][key] = data[key];
            }
        }
        var post = $("#chat_"+id);
    }

    if ("name" in data) {
        post.find(".name_part").text(data.name);
    }
    if ("trip" in data) {
        post.find(".trip_code").text(data.trip);
        var contrib = (contribs.indexOf(data.trip) > -1);
        var admin = (admins.indexOf(data.trip) > -1);
        var name = post.find(".chat_name");
        name.toggleClass("contrib", contrib && !admin);
        name.toggleClass("admin", admin);
    }
    if ("convo" in data) {
        post.find(".chat_convo").text(data.convo);
    }
    if ("date" in data) {
        post.find(".chat_date").text(data.date);
    }
    if ("image" in data) {
        var container = post.find(".chat_img_cont");
        container.empty();
        if (data.image) {
            var imageURL = "/tmp/uploads/" + data.image.match(/[\w\-\.]*$/)[0];
            var image = $("<img height='100px' class='chat_img'>");
            image.attr("src", imageURL);
            if(!$("#autoimages").prop('checked')) {	
                image.css('display', 'none');
            }
            image.click(function() {
                window.open(imageURL);
            });
            image.thumbPopup({
                imgSmallFlag: "",
                imgLargeFlag: "",
                popupCSS: {'max-height': '97%', 'max-width': '75%'}
            });
            container.append(image);
        }
    }
    if ("body" in data) {
        // Remove any old backlinks to this post
        $([$("body")[0], future_ids[0]]).find(".back_link[data-dest='"+id+"']").remove();

        // Process body markup
        var body_text = data.body.replace(/>>([0-9]+)/g,"{$1}")
        var body_html = escapeHTML(body_text);
        body_html = body_html.replace(/^\&gt;(.*)$/gm, "<span class='greentext'>&gt;$1</span>")
        var ref_ids = [];
        body_html = body_html.replace(/\{([0-9]+)\}/g, function(match_full, ref_id_str) {
            var ref_id = parseInt(ref_id_str);
            if (ref_ids.indexOf(ref_id) == -1) ref_ids.push(ref_id);
            return "<a class='quote_link' href='#' data-src='"+id+"' data-dest='"+ref_id+"'/>";
        });
        body_html = body_html.replace(/\r?\n/g, '<br />');
        var body = post.find(".chat_body");
        body.html(body_html);
        setup_quote_links(body.find(".quote_link"));

        // Create new backlinks
        $(ref_ids).each(function() {
            var link = $("<a class='back_link' href='#'/>");
            link.attr({"data-src": this, "data-dest": id});
            setup_quote_links(link);
            var their_refs = $("#chat_"+this+" .chat_refs");
            if (their_refs.length == 0) {
                future_ids.append(link);
            } else {
                their_refs.append(" ", link);
            }
        });
    }

    if (new_post) {
        if (window_focus === false) {
            if ($('#convo_filter').val()=='filter') {
                var convo = $('#convo').val() ? $('#convo').val() : "General";
                if (data.convo == convo) {
                    notifications();
                }
            } else {
                notifications();
            }
        }

        $(".chats:first").append(post);

        if(fast){
            $("#chat_"+id).css('opacity','1');
            apply_filter($('#convo_filter').val()); 
            return;
        }
        apply_filter($('#convo_filter').val()); 
        
        $("#chat_"+id).animate({
            opacity:1
        },300, 'swing', function(){
        });
    }
}

function scroll(){    
    var scr = $('.chats:first')[0].scrollHeight;
    scr+=10;
    $(".chats:first").animate({
        scrollTop: scr
    },200,'swing',function(){
                   
    });
}

function clear_fields(){
    $("#image").val('');
    $("#body").val('');
    $("#sum").val('');
}

function apply_filter(value){
    var convo = $('#convo').val();
    if(convo == "")
    convo = "General";
    $('.chat').toggleClass('chat_dim', false);
    $('.chat').toggleClass('chat_hidden', false);

    if (value == "highlight"){
        $('.chat').toggleClass(function() {
            var id = parseInt(this.id.match(/\d+/)[0]);
            if(convo == chat[id].convo)
            return '';
            else
            return 'chat_dim';
            }, true);
    } else if (value == "filter"){
        $('.chat').toggleClass(function() {
            var id = parseInt(this.id.match(/\d+/)[0]);
            if(convo == chat[id].convo)
            return '';
            else
            return 'chat_hidden';
            }, true);
    }
}

function draw_chat(data){
    for(i in data) {
        update_chat(data[i], true);
    }
}

window.onload = function(){
    var path = window.location.pathname;
    var chat_id = path.slice(path.lastIndexOf('/')+1);
    socket.on('request_location',function(data){
        scroll();
        socket.emit('subscribe', chat_id);
    });
    var title = 'LiveChan';
    window.document.title = title;

    $(window).focus(function() {
        unread_chats = 0;
        window.document.title = title;
        clearInterval(window_alert);
        window_focus = true;
    })
        .blur(function() {
            window_focus = false;
        });

    $("#name").keydown(function(event){
        if(event.keyCode == 13) {
            event.preventDefault();
            return false;
        }
    });

    $("#convo").keydown(function(event){
        if(event.keyCode == 13) {
            event.preventDefault();
            return false;
        }
    });

    $("#body").keydown(function (e) {
        if (!e.shiftKey && e.keyCode == 13 && $("#autosubmit").prop('checked')
        && cool_down_timer<=0) {
            submit_chat();
            return false;
        }
    });


    $.ajax({
        type: "GET",
        url: "/data/"+chat_id
    }).done(function(data) {
        draw_chat(data);
        socket.on('chat', function (data) {
            update_chat(data);
            if($("#autoscroll").prop('checked'))
                scroll();
        });
    });

    if(get_cookie("password_livechan")=="")
        window.location.href='/login?page='+path;


    $('iframe#miframe').load(function() {
        posting = false;
        var resp = JSON.parse($("#miframe"
        ).contents()[0].body.childNodes[0].innerHTML);
        if(resp.failure)
            div_alert(resp.failure);
        else if(resp.id)
        {
            my_ids.push(resp.id);
            if(html5) localStorage['my_ids'] = JSON.stringify(my_ids);
            var links = $([$("body")[0], future_ids[0]]).find(".quote_link, .back_link").filter("[data-dest='"+resp.id+"']");
            setup_quote_links(links);
        }
    });

    $('#convo_filter').change(function(){
        apply_filter($(this).val()); 
    });
    
    $('#theme_select').change(function(){
        get_css($(this).val());
        localStorage['theme'] = $(this).val();
    });
    
    $("#autoimages").change(function () {
        if (!$("#autoimages").prop('checked'))
            $('.chat_img').hide('slow');
        else
            $('.chat_img').show('slow');
     });

}
