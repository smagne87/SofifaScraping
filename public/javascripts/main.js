$(document).ready(function(){
    $("#btnStart").on('click', function(e){
        $.get('/scrape/start', function(data){
            $('#progress-content').html(data);
        });
    });

    $("#selectPlayer").on('submit', function(e){
      var form = $(this),
      playerField = form.find('input[type="hidden"]');
      if(playerField.val() == "0"){
        e.preventDefault();
        playerField.focus();
        return;
      }
    });

    $("#btnExport").on('click', function(e){
        $.get('/scrape/export', function(data){
            $('#export-message').html(data.message);
        });
    });

    $('#autoCompletePlayer').autocomplete({
        serviceUrl: '/draft/autocompletePlayers',
        onSelect: function (suggestion) {
            if ($('#hdnSelectedPlayerId').val() != suggestion.data) {
                $('#hdnSelectedPlayerId').val(suggestion.data);
                $("#btnSubmit").removeAttr("disabled");
            }
        },
        onInvalidateSelection: function () {
            $('#hdnSelectedPlayerId').val(0);
            $("#btnSubmit").attr("disabled", "disabled");
        }
    });

    $("#login").on('submit', function(e){
        var form = $(this),
            emailField = $(this).find('input[type="email"]'),
            passwordField = $(this).find('input[type="password"]');

        if(emailField.val() === ""){
            e.preventDefault();
            emailField.focus();
            displayError('Email is required!');
            return;
        }

        if(passwordField.val() === ""){
            e.preventDefault();
            passwordField.focus();
            displayError('Password is required!');
            return;
        }
    });

    $("#sUserTeam").on("change", function(){
        if($(this).val() != "0"){
            $.get('/users/playerByUser', { idUser: $(this).val() }, function(data){
                if($("#teamSelected").length){
                    $("#teamSelected").remove();
                }
                $("#otherTeam").html(data);
            });
        }
        else{
            if($("#teamSelected").length){
                $("#teamSelected").remove();
            }
        }
    });
    $("#register").on('submit', function(e){
        var form = $(this),
            usernameField = $(this).find('input[type="text"]'),
            emailField = $(this).find('input[type="email"]'),
            passwordField = $(this).find('input[type="password"]'),
            emailRegex = new RegExp(/^([\w\.\-]+)@([\w\-]+)((\.(\w){2,3})+)$/i);

        if(usernameField.val() === ""){
            e.preventDefault();
            usernameField.focus();
            displayError('Username is required!');
            return;
        }

        if(emailField.val() === ""){
            e.preventDefault();
            emailField.focus();
            displayError('Email is required!');
            return;
        }
        else{
            var validEmail = emailRegex.test(emailField.val());
            if(!validEmail){
                e.preventDefault();
                emailField.focus();
                displayError('Email format invalid!');
                return;
            }
        }

        if(passwordField.val() === ""){
            e.preventDefault();
            passwordField.focus();
            displayError('Password is required!');
            return;
        }
    });
});

function displayError(errorMessage, idPlaceHolder){
    if (!idPlaceHolder) {
        idPlaceHolder = "#errorPlaceHolder";
    }
    var errorPlaceHolder = $(idPlaceHolder);
    if (errorPlaceHolder) {
        errorPlaceHolder.html("<button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>" + "<span>" + errorMessage + "</span>");
        errorPlaceHolder.show();
    }
    else {
        alert('PLEASE ADD ERROR PLACEHOLDER TO AVOID THIS JS ALERT \n error: ' + errorMessage);
    }
}