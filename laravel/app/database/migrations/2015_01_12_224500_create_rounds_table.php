<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;

class CreateRoundsTable extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::create('rounds', function(Blueprint $table)
		{
			$table->increments('id');
			$table->integer('loser_id')->unsigned()->index()->nullable();
			$table->foreign('loser_id')->references('id')->on('players')->onDelete('set null');
			$table->timestamps();
		});
	}


	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down()
	{
		Schema::drop('rounds');
	}

}
