<?php

class Fettround extends \Eloquent {

	// Add your validation rules here
	public static $rules = [
		'loser_id' => 'required|exists:players,id'
	];

	// Don't forget to fill this array
	protected $fillable = ['loser_id'];

	public function loser()
	{
		return $this->belongsTo('Player');
	}

}