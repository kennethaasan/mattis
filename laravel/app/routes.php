<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the Closure to execute when that URI is requested.
|
*/


//Set pattern for input parameters for security
Route::pattern('rounds', '[0-9]+');
Route::pattern('players', '[0-9]+');
Route::pattern('fettrounds', '[0-9]+');

Route::get('/', array('uses' => 'PlayersController@index', 'as' => 'home'));

Route::get('api/months', ['as' => 'api.months', 'uses' => 'PlayersController@api_months']);
Route::get('months', ['as' => 'months', 'uses' => 'PlayersController@months']);

Route::resource('players', 'PlayersController', ['only' => ['index', 'create', 'store', 'show']]);
Route::resource('rounds', 'RoundsController', ['only' => ['index', 'create', 'store', 'show', 'destroy']]);
Route::resource('fettrounds', 'FettroundsController', ['only' => ['index', 'create', 'store', 'destroy']]);

//Route::get('login', ['as' => 'login', 'uses' => 'SessionsController@create']);
//Route::get('logout', ['as' => 'logout', 'uses' => 'SessionsController@destroy']);
//Route::resource('sessions', 'SessionsController', ['only' => ['create', 'destroy', 'store']]);

/*Route::group(array('before' => 'auth.basic'), function()
{
	//Route::resource('rounds', 'RoundsController');
	//Route::resource('players', 'PlayersController');
	//Route::resource('fettrounds', 'FettroundsController');
});*/


// =============================================
// CATCH ALL ROUTE =============================
// =============================================
// all routes that are not home or api will be redirected to the frontend
// this allows angular to route them
/*App::missing(function($exception)
{
	return View::make('home');
});*/