<?php

class FettroundsController extends \BaseController {

	public function __construct() {
        $this->beforeFilter('auth.basic', array('except' => array('index')));
    }

	/**
	 * Display a listing of the resource.
	 * GET /fettrounds
	 *
	 * @return Response
	 */
	public function index()
	{
		$fettrounds = Fettround::orderBy('id', 'desc')
			->whereRaw('YEAR(fettrounds.created_at) = ?', array(date('Y')))
			->paginate(10);

		return View::make('fettrounds.index', array(
			'fettrounds' => $fettrounds,
		));
	}

	/**
	 * Show the form for creating a new resource.
	 * GET /fettrounds/create
	 *
	 * @return Response
	 */
	public function create()
	{
		$players = Player::orderBy('name', 'asc')->get()->toArray();

		return View::make('fettrounds.create', array(
			'players' => $players
		));
	}

	/**
	 * Store a newly created resource in storage.
	 * POST /fettrounds
	 *
	 * @return Response
	 */
	public function store()
	{
		$input = Input::all();
		$validator = Validator::make($data = $input, Fettround::$rules);

		if ($validator->fails())
		{
			return Redirect::back()->withErrors($validator)->withInput();
		}

		Fettround::create(array(
			'loser_id' => $input['loser_id']
		));

		return Redirect::home()->with('flash_message', 'Fettmattisen er opprettet.');
	}

	/**
	 * Remove the specified resource from storage.
	 * DELETE /fettrounds/{id}
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function destroy($id)
	{
		$fettmattis = Fettround::findOrFail($id);
		$fettmattis_date = date('Y-m-d', strtotime($fettmattis->created_at));

		$today = date('Y-m-d', time());

		if ($fettmattis_date !== $today)
		{
			return Redirect::back()->with('flash_message', 'Du kan ikke slette gammel statistikk. Kontakt Kenneth!');
		}

		Fettround::destroy($id);

		return Redirect::home()->with('flash_message', 'Fettmattisen er slettet.');
	}

}
