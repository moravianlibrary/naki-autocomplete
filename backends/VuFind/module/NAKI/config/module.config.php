<?php
namespace NAKI\Module\Configuration;

$config = [
    'vufind' => [
        'plugin_managers' => [
            'autocomplete' => [
                'factories' => [
                    \NAKI\Autocomplete\SolrEdgeFaceted::class => \NAKI\Autocomplete\SolrEdgeFacetedFactory::class,
                ],
                'aliases' => [
                    'solredgefaceted' => \NAKI\Autocomplete\SolrEdgeFaceted::class,
                ],
            ],
        ],
    ],
];

return $config;