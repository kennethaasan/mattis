<?php

class RoundsController extends \BaseController {

	public function __construct() {
        $this->beforeFilter('auth.basic', array('except' => array('index', 'show')));
    }

	/**
	 * Display a listing of the resource.
	 * GET /rounds
	 *
	 * @return Response
	 */
	public function index()
	{
		$rounds = Round::orderBy('id', 'desc')
			->whereRaw('YEAR(rounds.created_at) = ?', array(date('Y')))
			->paginate(10);

		return View::make('rounds.index', array(
			'rounds' => $rounds,
		));
	}

	/**
	 * Show the form for creating a new resource.
	 * GET /rounds/create
	 *
	 * @return Response
	 */
	public function create()
	{
		$players = Player::orderBy('name', 'asc')->get()->toArray();

		return View::make('rounds.create', array(
			'players' => $players
		));
	}

	/**
	 * Store a newly created resource in storage.
	 * POST /rounds
	 *
	 * @return Response
	 */
	public function store()
	{
		$input = Input::all();
		$validator = Validator::make($data = $input, Round::$rules);

		if ($validator->fails())
		{
			return Redirect::back()->withErrors($validator)->withInput();
		}

		if (!isset($input['players']))
		{
			return Redirect::back()->with('flash_message', 'Du må velge deltagere!')->withInput();
		}

		if (!in_array($input['loser_id'], $input['players']))
		{
			return Redirect::back()->with('flash_message', 'Du må velge en deltager som er med i spillet!')->withInput();
		}

		$round = Round::create(array(
			'loser_id' => $input['loser_id']
		));

		$round->players()->sync($input['players']);

		//Remove cache for stats
		Cache::forget('api_months');

		return Redirect::home()->with('flash_message', 'Runden er opprettet.');
	}

	/**
	 * Display the specified resource.
	 * GET /rounds/{id}
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function show($id)
	{
		$round = Round::findOrFail($id);

		$players = $round->players;

		return View::make('rounds.show', array(
			'round'	=> $round,
			'players' => $players
		));
	}

	/**
	 * Remove the specified resource from storage.
	 * DELETE /rounds/{id}
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function destroy($id)
	{
		$round = Round::findOrFail($id);
		$round_date = date('Y-m-d', strtotime($round->created_at));

		$today = date('Y-m-d', time());

		if ($round_date !== $today)
		{
			return Redirect::back()->with('flash_message', 'Du kan ikke slette gammel statistikk. Kontakt Kenneth!');
		}

		Round::destroy($id);

		//Remove cache for stats
		Cache::forget('api_months');

		return Redirect::home()->with('flash_message', 'Runden er slettet.');
	}

}
