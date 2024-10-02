<?php

class Player extends \Eloquent {

	// Add your validation rules here
	public static $rules = [
		'name' => 'required|min:2|max:100'
	];

	// Don't forget to fill this array
	protected $fillable = ['name'];

	public function rounds()
    {
        return $this->belongsToMany('Round');
    }

}