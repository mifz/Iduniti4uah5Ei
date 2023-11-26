CREATE OR REPLACE FUNCTION random_between(low INT ,high INT) 
   RETURNS INT AS
$$
BEGIN
   RETURN floor(random()* (high-low + 1) + low);
END;
$$ language 'plpgsql' STRICT;


create sequence public.cities_id_seq;
alter sequence cities_id_seq owned by cities.id;
create sequence public.forecast_id_seq;
alter sequence forecast_id_seq owned by forecast.id;

create table public.cities (
                               id bigint primary key not null default nextval('cities_id_seq'::regclass),
                               name character varying(255)
);

create table public.forecast (
                                 id bigint primary key not null default nextval('forecast_id_seq'::regclass),
                                 "cityId" bigint,
                                 "dateTime" bigint,
                                 temperature integer,
                                 summary text,
                                 foreign key ("cityId") references public.cities (id)
                                     match simple on update no action on delete cascade
);

INSERT INTO "public"."cities" ("name") VALUES ('Moscow'), ('Ryazan'), ('Krasnodar'), ('Vladikavkaz'), ('Sochi'), ('Samara'), ('Volgograd'), ('Novosibirsk'), ('Vladivostok'), ('Kostroma');

INSERT INTO "public"."forecast" ("cityId", "dateTime", "temperature", "summary") 
SELECT
   random_between(1,10), extract(epoch from (now() - random() * INTERVAL '10 days'))::integer, random_between(8,15), (array['Sunny','Fair','Cloudy','Showers','Squalls','Thunderstorms','Drizzle'])[floor(random() * 7 + 1)]
FROM generate_series(1, 10000);

