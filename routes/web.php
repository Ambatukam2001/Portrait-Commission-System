<?php

use Illuminate\Support\Facades\Route;

/*
| Static UI + Supabase lives under /public. These routes keep local Laravel
| installs from serving Blade while the app is fronted by HTML + JS.
*/

Route::get('/', function () {
    return redirect('/index.html');
});

Route::get('/portfolio', function () {
    return redirect('/portfolio.html');
});

Route::get('/login', function () {
    return redirect('/login.html');
});

Route::get('/admin', function () {
    return redirect('/dashboard.html');
});
