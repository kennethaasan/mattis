<?php

class PlayersController extends \BaseController {

	public function __construct() {
        $this->beforeFilter('auth.basic', array('except' => array('index', 'show', 'api_months', 'months')));
    }

	/**
	 * Display a listing of players
	 *
	 * @return Response
	 */
	public function index()
	{
		$players = Player::all()->toArray();

		foreach ($players as $key => $value) {
			$players[$key]['rounds'] = Player::find($players[$key]['id'])
				->rounds()
				->whereRaw('YEAR(rounds.created_at) = ?', array(date('Y')))
				->count();

			$players[$key]['loser'] = Round::where('loser_id', $players[$key]['id'])
				->whereRaw('YEAR(rounds.created_at) = ?', array(date('Y')))
				->count();

			$players[$key]['loser_percentage'] = 0;
			if ($players[$key]['rounds'] > 0 && $players[$key]['loser'] > 0)
			{
				$players[$key]['loser_percentage'] = number_format($players[$key]['loser'] / $players[$key]['rounds'] * 100, 0);
			}
		}

		foreach ($players as $key => $value) {
			if ($players[$key]['rounds'] == 0)
			{
				unset($players[$key]);
			}
		}

		usort($players, function($a, $b) {
			//return $b['loser_percentage'] - $a['loser_percentage'];

			if ($b['loser_percentage'] !== $a['loser_percentage'])
			{
				return $b['loser_percentage'] - $a['loser_percentage'];
			}

			return $a['rounds'] - $b['rounds'];

		});

		$fettrounds = Fettround::leftJoin('players', 'players.id', '=', 'fettrounds.loser_id')
			->whereRaw('YEAR(fettrounds.created_at) = ?', array(date('Y')))
			->groupBy('players.id')
			->select(DB::raw('players.id as player_id, players.name, count(*) as fettmattis'))
			->orderBy('fettmattis', 'desc')
			->get();

		$rounds = Round::orderBy('id', 'desc')
			->whereRaw('YEAR(rounds.created_at) = ?', array(date('Y')))
			->paginate(10);

		return View::make('players.index', array(
			'players' 	=> $players,
			'fettrounds' => $fettrounds,
			'rounds'	=> $rounds
		));
	}

	/**
	 * Show the form for creating a new resource.
	 * GET /players/create
	 *
	 * @return Response
	 */
	public function create()
	{
		return View::make('players.create');
	}


	/**
	 * Store a newly created player in storage.
	 *
	 * @return Response
	 */
	public function store()
	{
		$data = Input::all();

		$validator = Validator::make($data, Player::$rules);

		if ($validator->fails())
		{
			return Redirect::back()->withErrors($validator)->withInput();
		}

		$player = Player::create($data);

		return Redirect::home()->with('flash_message', 'Spilleren er opprettet.');
	}

	/**
	 * Display the specified player.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function show($id)
	{
		$player = Player::findOrFail($id);

		$player['rounds'] = $player->rounds()->count();
		$player['loser'] = Round::where('loser_id', $player->id)->count();
		$player['loser_percentage'] = 0;
		if ($player['rounds'] > 0 && $player['loser'] > 0)
		{
			$player['loser_percentage'] = number_format($player['loser'] / $player['rounds'] * 100, 1);
		}

		$fettrounds = Fettround::leftJoin('players', 'players.id', '=', 'fettrounds.loser_id')
			->groupBy('players.id')
			->select(DB::raw('players.name, count(*) as fettmattis'))
			->where('players.id', $player->id)
			->get();

		Paginator::setPageName('rounds_mattis');
		$rounds_mattis = Round::orderBy('id', 'desc')
			->where('loser_id', $player->id)
			->paginate(5);


		Paginator::setPageName('rounds_participate');
		$rounds_participate = Round::orderBy('rounds.id', 'desc')
			->leftJoin('player_round', 'rounds.id', '=', 'player_round.round_id')
			->where('player_round.player_id', $player->id)
			->select(DB::raw('rounds.id, rounds.loser_id, rounds.created_at, player_round.player_id'))
			->paginate(5);

		/*return array(
			'player' 	=> $player,
			'fettrounds' => $fettrounds,
			'rounds_mattis'	=> $rounds_mattis,
			'rounds_participate' => $rounds_participate
		);*/

		return View::make('players.show', array(
			'player' 	=> $player,
			'fettrounds' => $fettrounds,
			'rounds_mattis'	=> $rounds_mattis,
			'rounds_participate' => $rounds_participate
		));
	}

	/**
	 * Show the form for editing the specified resource.
	 * GET /players/{id}/edit
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function edit($id)
	{
		/*$round = Round::findOrFail($id);

		return View::make('rounds.edit', array(
			'round'	=> $round,
		));*/
	}

	/**
	 * Update the specified player in storage.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function update($id)
	{
		/*$data = Input::all();

		$validator = Validator::make($data, Player::$rules);

		if ($validator->fails())
		{
			return $this->respondBadRequest('Validation fails.', $validator->messages()->toArray());
		}

		$player = Player::find($id);

		$player->update($data);

		return $this->respondCreated('Player successfully updated.');*/
	}

	/**
	 * Remove the specified player from storage.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function destroy($id)
	{
		/*Player::destroy($id);

		return $this->respondCreated('Player successfully deleted.');*/
	}

	private function get_month_name($month)
	{
		switch ($month) {
		    case 1:
		        $month = 'Januar';
		        break;
		    case 2:
		        $month = 'Februar';
		        break;
		    case 3:
		        $month = 'Mars';
		        break;
		    case 4:
		        $month = 'April';
		        break;
		    case 5:
		    	$month = 'Mai';
		    	break;
		    case 6:
		    	$month = 'Juni';
		    	break;
		    case 7:
		    	$month = 'Juli';
		    	break;
		    case 8:
		    	$month = 'August';
		    	break;
		    case 9:
		    	$month = 'September';
		    	break;
		    case 10:
		    	$month = 'Oktober';
		    	break;
		    case 11:
		    	$month = 'November';
		    	break;
		    case 12:
		    	$month = 'Desember';
		    	break;
		}

		return $month;
	}

	public function api_months()
	{
		//Check if cache exsists
		if (Cache::has('api_months'))
		{
			return Cache::get('api_months');
		}

		$players = Player::all()->toArray();

		$rounds = Round::orderBy('rounds.created_at', 'asc')
			->whereRaw('YEAR(rounds.created_at) = ?', array(date('Y')))
			->select(DB::raw('rounds.id, rounds.created_at, MONTH(rounds.created_at) AS created_at_month, rounds.loser_id'))
			->get();

		$months = array();
		$months_to_show = array();

		foreach ($rounds as $round) {
			if (! isset($months[$round->created_at_month]))
			{
				$month = $round->created_at_month;

				//$months[$month] = array();
				$months[$month] = 0;

				array_push($months_to_show, $this->get_month_name($month));
			};
		}

		//Add months to each player
		foreach ($players as $pKey => $pValue) {
			$players[$pKey]['months']['lost'] = $months;
			$players[$pKey]['months']['rounds_participate'] = $months;
			$players[$pKey]['months']['loser_percentage'] = $months;
		}

		//Add every round the player lost
		foreach ($players as $pKey => $pValue) {
			foreach ($rounds as $rKey => $rValue) {
				if ($rounds[$rKey]['loser_id'] === $players[$pKey]['id'])
				{
					$players[$pKey]['months']['lost'][$rounds[$rKey]['created_at_month']]++;
				}
			}
		}

		/*q//Get all players in rounds
		foreach ($rounds as $rKey => $rValue) {
			$rounds[$rKey]['players'] = Round::find($rounds[$rKey]['id'])->players()->get();
		}*/

		//Count participated rounds each month
		foreach ($players as $pKey => $pValue) {
			foreach ($players[$pKey]['months']['rounds_participate'] as $rpKey => $rpValue) {
				foreach ($rounds as $rKey => $rValue) {
					if ($rpKey == $rounds[$rKey]['created_at_month'])
					{
						foreach ($rounds[$rKey]['players'] as $rpaKey => $rpaValue) {
							if ($rounds[$rKey]['players'][$rpaKey]['id'] == $players[$pKey]['id'])
							{
								$players[$pKey]['months']['rounds_participate'][$rpKey]++;
							}
						}
					}
				}
			}
		}

		foreach ($players as $pKey => $pValue) {
			foreach ($players[$pKey]['months']['loser_percentage'] as $lKey => $lValue) {
				$rounds_participate = $players[$pKey]['months']['rounds_participate'][$lKey];
				$rounds_lost = $players[$pKey]['months']['lost'][$lKey];

				if ($rounds_participate > 0 && $rounds_lost > 0)
				{
					$players[$pKey]['months']['loser_percentage'][$lKey] = (int)number_format($rounds_lost / $rounds_participate * 100, 0);
				}
				else if ($rounds_participate == 0)
				{
					$players[$pKey]['months']['loser_percentage'][$lKey] = null;
				}
			}
		}

		$data = array(
			'players' 	=> $players,
			'months'	=> $months_to_show
		);

		//Save in cache (60 minutes * 24 hours)
		Cache::put('api_months', $data, 60 * 24 * 7);

		return $data;

	}

	public function months()
	{
		return View::make('players.months');
	}

}
