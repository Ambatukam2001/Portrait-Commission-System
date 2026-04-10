<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'social',
        'deadline',
        'medium',
        'size',
        'payment',
        'address',
        'reference_photo',
        'receipt_photo',
        'status',
    ];
}
