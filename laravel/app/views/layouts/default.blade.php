<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <title>Mattis</title>
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <link rel="stylesheet" href="{{ asset('bower_components/bootstrap/dist/css/bootstrap.min.css') }}">
        <link rel="stylesheet" href="{{ asset('css/main.css') }}">

        <script src="{{ asset('bower_components/jquery/dist/jquery.min.js') }}"></script>
	    <script src="{{ asset('bower_components/bootstrap/dist/js/bootstrap.min.js') }}"></script>
	    <script src="{{ asset('js/main.js') }}"></script>
    </head>
    <body>

	    <div class="navbar navbar-inverse navbar-fixed-top" role="navigation">
			<div class="container">
				<div class="navbar-header">
					<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
						<span class="sr-only">Toggle navigation</span>
						<span class="icon-bar"></span>
						<span class="icon-bar"></span>
						<span class="icon-bar"></span>
					</button>
				  	{{ link_to_route('home', 'Mattis', null, ['class' => 'navbar-brand']) }}
				</div>
				<div id="navbar" class="collapse navbar-collapse">
					<ul class="nav navbar-nav">
						<li>{{ link_to_action('PlayersController@index', 'Statistikk') }}</li>
						<li>{{ link_to_action('PlayersController@months', 'Månedsstatistikk') }}</li>
						<li>{{ link_to_action('RoundsController@index', 'Runder') }}</li>
						<li>{{ link_to_action('FettroundsController@index', 'Fettmattis') }}</li>
					</ul>
					<ul class="nav navbar-nav navbar-right">
						<li>{{ link_to_action('RoundsController@create', 'Ny runde') }}</li>
						<li>{{ link_to_action('FettroundsController@create', 'Ny fettmattis') }}</li>
						<li>{{ link_to_action('PlayersController@create', 'Ny spiller') }}</li>
					</ul>
		        </div>
			</div>
	    </div>

	    <div class="container">

	    	@if (Session::has('flash_message'))
	    		<div class="flash-message">
	    			<div class="alert alert-info alert-dismissible" role="alert">
						<button type="button" class="close" data-dismiss="alert" aria-label="Close">
							<span aria-hidden="true">&times;</span>
						</button>
						<strong>{{ Session::get('flash_message') }}</strong>
					</div>
				</div>
			@endif

	  		@if ($errors->any())
		    	<div class="alert alert-danger">
		    		<ul>
		    			@foreach ($errors->all() as $error)
		    				<li>{{ $error }}</li>
		    			@endforeach
		    		</ul>
		    	</div>
			@endif

			@yield('content')

			<hr>

			<footer>
				<p>&copy; Vanvik IL</p>
			</footer>

	    </div> <!-- /container -->

    </body>
</html>
