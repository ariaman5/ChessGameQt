// TO-DO Other conditions of Draw
// TO-DO Castling
// TO-DO Promotion
// TO-DO Ranking

.import "graphic.js" as Graphic
.import Global 1.0 as Global



class Player {
    constructor(name, color){
        this.name = name
        this.cl = color
        this.check = false
        this.move_history = []
        this.win_cnt = 0
        this.lose_cnt = 0
        this.draw_cnt = 0
    }

    // get number of movements this player made
    get move_num(){
        return this.move_history.length
    }

    // adds a move to player move history
    add_move(move){
        this.move_history.push(move)
    }

    set_player(json_player){
        this.win_cnt =  json_player["win_cnt"]
        this.lose_cnt =  json_player["lose_cnt"]
        this.draw_cnt =  json_player["draw_cnt"]
        this.name =  json_player["name"]
        this.cl =  json_player["cl"]
        this.check =  json_player["check"]
        this.move_history = json_player["move_history"]

    }

    print_history(){
        for(var i = 0; i < this.move_history.length; i++){
            console.log(this.move_history[i])
        }
    }
}


// this function tries to move a piece on the given board
// from <start_index> to <target_index>(If there is any)
// If the move is impossible, but game is not finished, it returns 0
// if the game is finished, it returns -1
// If the move is possible, it returns 1
function try_move(board, black_unit_indices,
                  white_unit_indices, start_index, target_index){
    // start_unit is the unit that player wants to move
    // target_unit is the unit in target_cell, if
    // the target is empty, there is an empty unit there

    var target_unit = board[target_index]
    var start_unit = board[start_index]

    var cl = Global.Global.players[Global.Global.player_turn].cl
    var op_cl = (cl === "white" ? "black" : "white")
    if(start_unit.cl === cl){
        var valid_move = is_valid_mv(start_index, target_index, board)
        var is_threatened = check(start_index, target_index, board, cl)

        if(valid_move && (is_threatened === -1)){

            Global.Global.threatened_king = -1
            if(start_index === Global.Global.b_king_pos){
                Global.Global.b_king_pos = target_index
            }

            if(start_index === Global.Global.w_king_pos){
                Global.Global.w_king_pos = target_index
            }

            if(start_unit.cl === "white"){
                white_unit_indices[board[start_index].id] = target_index
                if(board[target_index].cl === "black"){
                    black_unit_indices[board[target_index].id] = -1
                }
            }
            if(start_unit.cl === "black"){
                black_unit_indices[board[start_index].id] = target_index
                if(board[target_index].cl === "white"){
                    white_unit_indices[board[target_index].id] = -1
                }
            }

            // move in logical board

            var threatened = check(start_index, target_index, board, op_cl)
            Global.Global.is_threatened = threatened

            board[start_index].index = target_index
            board[target_index] = board[start_index]
            board[start_index] = empty_unit()


            Global.Global.players[Global.Global.player_turn].add_move
                    (move_str(start_index, target_index))

            if(Global.Global.player_turn === 0){
                Global.Global.player_turn = 1
            }
            else{
                Global.Global.player_turn = 0
            }




            Global.Global.game.set("normal", board,
                                   Global.Global.player_turn, Global.Global.players[0],
                                   Global.Global.players[1], "", Global.Global.starter)

            if(threatened !== -1){
                Global.Global.threatened_king = threatened
                var winner = ""
                var loser = ""
                if(is_mate(target_index, board, black_unit_indices,
                           white_unit_indices)){
                    Global.Global.game.set("normal", board,
                                           Global.Global.player_turn,
                                           Global.Global.players[0],
                                           Global.Global.players[1],
                                           Global.Global.players[Global.Global.player_turn],
                                           Global.Global.starter)

                    winner = Global.Global.game.winner
                    loser = Global.Global.player_turn === 0 ?
                                Global.Global.players[1] :
                                Global.Global.players[0];


                    Global.Global.winner = winner.name
                    update_statistics(winner, loser)

                    var info = {"type": "normal",
                        "start": "white",
                        "turn": Global.Global.game.turn,
                        "winner": Global.Global.game.winner,
                        "threatened_king": Global.Global.threatened_king,
                        "is_threatened": Global.Global.threatened_king,
                        "b_king_pos": Global.Global.b_king_pos,
                        "w_king_pos": Global.Global.w_king_pos,
                        "black_unit_indices": Global.black_unit_indices,
                        "white_unit_indices": Global.white_unit_indices
                    }




                    Global.Global.gameutils.save_game("./newGame1.json",
                                                      Global.Global.players,
                                                      Global.Global.l_board, info)

                    return -1;
                }
            }
            else if(is_draw(board)){
                update_statistics(winner, loser)
                Global.Global.gameutils.save_game("./newGame1.json",
                                                  Global.Global.players,
                                                  Global.Global.l_board, info)

                return -1;
            }


            return 1;
        }
    }

    return 0;
}

// i
function move_str(start_index, target_index){
    var from_index = start_index
    var col = String.fromCharCode('a'.charCodeAt(0) + from_index % 8)

    var from =  col + (8 - Math.floor(from_index / 8))

    var to_index = target_index
    col = String.fromCharCode('a'.charCodeAt(0) + to_index % 8)
    var to =  col + (8 - Math.floor(to_index / 8))
    var move = from + '.' + to
    return move
}

class Game{
    constructor(type = "normal", board = [], turn = 0,
                player1, player2, winner = "", start = "white") {
        this.type = type
        this.board = board
        this.turn = turn
        this.player1 = player1
        this.player2 = player2
        this.winner = winner
        this.start = start
    }

    set(type, board, turn = 0, player1, player2, winner,
        start){
        this.type = type
        this.board = board
        this.turn = turn
        this.player1 = player1
        this.player2 = player2
        this.winner = winner
    }




    loadGame(savefile_path)
    {

        gameutils.load_game(qsTr(savefile_path))
        this.board = gameutils.game["board"]
        this.player1 = gameutils.game["players"][0]
        this.player2 = gameutils.game["players"][1]
        this.winner =  gameutils.game["info"]["winner"]
        this.type = gameutils.game["info"]["type"]
        this.turn = gameutils.game["info"]["turn"]
        this.start = gameutils.game["info"]["start"]
        Global.Global.l_board = this.board
        Global.Global.players[0].set_player(this.player1)
        Global.Global.players[1].set_player(this.player2)
        Global.Global.player_turn = this.turn
        Global.Global.threatened_king = gameutils.game["info"]["threatened_king"]
        Global.Global.is_threatened = gameutils.game["info"]["is_threatened"]
        Global.Global.black_unit_indices =
        gameutils.game["info"]["black_unit_indices"]
        Global.Global.white_unit_indices =
        gameutils.game["info"]["white_unit_indices"]
        Global.Global.b_king_pos =
        gameutils.game["info"]["b_king_pos"]
        Global.Global.w_king_pos =
        gameutils.game["info"]["w_king_pos"]

        Global.Global.game = this
    }

    set_player(json_game){
        this.win_cnt = JSON.parse(JSON.stringify(Jjson_player["win_cnt"]))
        this.lose_cnt = JSON.parse(JSON.stringify(json_player["lose_cnt"]))
        this.draw_cnt = JSON.parse(JSON.stringify(json_player["draw_cnt"]))
        this.name = JSON.parse(JSON.stringify(json_player["name"]))
        this.cl = JSON.parse(JSON.stringify(json_player["cl"]))
        this.check = JSON.parse(JSON.stringify(json_player["check"]))
        this.move_history = JSON.parse(JSON.stringify(json_player["move_history"]))
    }


    saveGame(to_destination, players, board, info){
        gameutils.save_game(to_destination, players, board, info)
    }


    resetGame(){
        Global.Global.l_board = []
        Global.Global.black_unit_indices = []
        Global.Global.white_unit_indices = []

        create_table(Global.Global.l_board,
                     Global.Global.black_unit_indices,
                     Global.Global.white_unit_indices,
                     Global.Global.b_king_pos,
                     Global.Global.w_king_pos)

        this.board = Global.Global.l_board


        Global.Global.players[0].check = false
        Global.Global.players[0].move_history = []

        Global.Global.players[1].check = false
        Global.Global.players[1].move_history = []

        this.player1 = Global.Global.players[0]
        this.player2 = Global.Global.players[1]
        var type = Global.Global.game.type
        gameutils.game = this
    }
    newPlayer(){

    }

    initNewGame(p1_name, p2_name){
        create_table(Global.Global.l_board,
                     Global.Global.black_unit_indices,
                     Global.Global.white_unit_indices,
                     Global.Global.b_king_pos,
                     Global.Global.w_king_pos)
        Global.Global.players = create_player(p1_name, p2_name);

        gameutils.add_to_all_players(JSON.parse(JSON.stringify(players[0])))
        gameutils.add_to_all_players(JSON.parse(JSON.stringify(players[1])))

        var game = new Game("normal", Global.Global.l_board,
                            0, Global.Global.players[0],
                            Global.Global.players[1], "")

        gameutils.game = JSON.parse(JSON.stringify(game))
        gameutils.new_game()

    }
}



// for test, will be changed later
function create_player(p1_name, p2_name){
    var players = []
    var p1 = new Player(p1_name, "white")
    var p2 = new Player(p2_name, "black")

    players.push(p1)
    players.push(p2)

    return players
}



// It returns an instance of class game with default settings.
function create_game(p1_name, p2_name){
    var game = new Game()
    Global.Global.players = create_player(p1_name, p2_name)

    create_table(Global.Global.l_board, Global.Global.black_unit_indices,
                 Global.Global.white_unit_indices)
    return game
}

// TO-DO add has_vertical, has_horizontal, has diagonal move to Unit class
class Unit{
    // utype -> unit type
    // color -> {black, white}
    // color costumization doesnt affect this class
    constructor(cl, utype, index = -1, id) {
        this.cl = cl
        this.unit_type = utype
        this.index = index
        this.id = id
    }
}






// insufficient

function is_insufficient(board){
    /*
      king against king
      king against king and bishop
      king against king and queen
      king and bishop against king and bishop,
with both bishops on squares of the same color
      */

    var alive_black = ""
    var alive_white = ""

    var b_bishop_cnt = 0;
    var w_bishop_cnt = 0;
    var bg_cl_w_bishop;
    var bg_cl_b_bishop;

    Global.Global.black_unit_indices.forEach(function(uindex){
        if(uindex !== -1){
            alive_black += (board[uindex].unit_type[0])

            if(board[uindex].unit_type === "bishop"){
                bg_cl_b_bishop = Graphic.cell_color(uindex)
                b_bishop_cnt++;
            }

            if(b_bishop_cnt > 1){
                return false;
            }
        }
    })
    Global.Global.white_unit_indices.forEach(function(uindex){
        if(uindex !== -1){
            alive_white += (board[uindex].unit_type[0])

            if(board[uindex].unit_type === "bishop"){
                bg_cl_w_bishop = Graphic.cell_color(uindex)
                w_bishop_cnt++;
            }

            if(w_bishop_cnt > 1){
                return false;
            }
        }
    })


    if(alive_black === "kb" || alive_black === "bk"){
        if(alive_black === "bk" || alive_black === "kb"){
            if(bg_cl_b_bishop === bg_cl_w_bishop){
                return true;
            }
            return false;
        }
    }

    if(alive_black === "k"){
        if(alive_white === "kb" || alive_white === "bk"){
            return true;
        }
        if(alive_white === "kq" || alive_white === "qk"){
            return true;
        }
        return false;
    }
    if(alive_white === "k"){
        if(alive_black === "kb" || alive_black === "bk"){
            return true;
        }
        if(alive_black === "kq" || alive_black === "qk"){
            return true;
        }
        return false;
    }
    return false;
}


function is_draw(board){
    if(is_insufficient(board)){
        return true;
    }

    return false;
}


function is_three_fold(board){

}

function is_fifty_move(board){

}


function is_mate(start_index, board, b_unit_indices, w_unit_indices){
    var start_unit = board[start_index]
    var tar_king_index;
    var attacking_unit_indices;
    var defending_unit_indices;
    var attack_unit_color = start_unit.cl;
    var defend_unit_color;

    if(attack_unit_color === "black"){
        tar_king_index = Global.Global.w_king_pos;
        defend_unit_color = "white";
        attacking_unit_indices = b_unit_indices;
        defending_unit_indices = w_unit_indices;
    }
    else{
        defend_unit_color = "black";
        tar_king_index = Global.Global.b_king_pos;
        attacking_unit_indices = w_unit_indices;
        defending_unit_indices = b_unit_indices;
    }

    //  see if king can move
    var delta_arr = [1, 7, 8, 9]

    for(var delta of delta_arr){
        if(is_valid_mv(tar_king_index, tar_king_index + delta, board)){
            if(check(tar_king_index, tar_king_index + delta, board, defend_unit_color)
                    === -1){
                return false;
            }
        }
        if(is_valid_mv(tar_king_index, tar_king_index - delta, board)){
            if(check(tar_king_index, tar_king_index - delta, board, defend_unit_color)
                    === -1){
                return false;
            }
        }
    }


    // check if attacking unit can be killed
    var can_kill = false;

    defending_unit_indices.forEach(function(uindex) {
        if(is_valid_mv(uindex, start_index, board)){
            if(check(uindex, start_index, board, defend_unit_color) === -1){
                can_kill = true;
                return;
            }
        }

    })

    if(can_kill) return false;


    var can_rescue = false;

    // check if something can go between them
    // if the threatener is horse and
    // horse can not be killed, it's checkmate.
    if(start_unit.unit_type === "horse"){
        return true;
    }

    var up_index = Math.max(start_index,  tar_king_index)
    var lp_index = Math.min(start_index, tar_king_index)


    var b_diagonal = [
                Global.Global.black_unit_indices[1],
                Global.Global.black_unit_indices[2],
                Global.Global.black_unit_indices[4]]

    var w_diagonal = [Global.Global.white_unit_indices[10],
                      Global.Global.white_unit_indices[11],
                      Global.Global.white_unit_indices[13]]


    var b_horizontal = [Global.Global.black_unit_indices[0],
                        Global.Global.black_unit_indices[3],
                        Global.Global.black_unit_indices[7]]

    var w_horizontal = [Global.Global.white_unit_indices[8],
                        Global.Global.white_unit_indices[11],
                        Global.Global.white_unit_indices[15]]

    var b_vertical = [
                Global.Global.black_unit_indices[0],
                Global.Global.black_unit_indices[3],
                Global.Global.black_unit_indices[7]]

    var w_vertical = [Global.Global.white_unit_indices[8],
                      Global.Global.white_unit_indices[11],
                      Global.Global.white_unit_indices[15]]

    delta_arr = [7, 9, -7, -9]

    for(delta of delta_arr){
        var unit = board[start_index + delta]
        if(unit.unit_type === "soldier"){
            if(unit.cl === "black"){
                b_diagonal.push(Global.Global.black_unit_indices[unit.index])
            }
            else if(unit.cl === "white"){
                w_diagonal.push(Global.Global.white_unit_indices[unit.index])
            }
        }
    }

    var diagonal, vertical, horizontal;
    if(defend_unit_color === "black"){
        diagonal = b_diagonal;
        vertical = b_vertical;
        horizontal = b_horizontal;
    }
    if(defend_unit_color === "white"){
        diagonal = w_diagonal;
        horizontal = w_horizontal;
        vertical = w_vertical;
    }

    if((up_index - lp_index) % 9 === 0){
        delta = 9;
    }
    else if((up_index - lp_index) % 7 === 0){
        delta = 7;
    }

    // diagonal iteration
    if((up_index - lp_index) % 9 === 0 || (up_index - lp_index) % 7 === 0){
        // \
        for(var j = up_index - delta; j > lp_index; j -= delta){
            for(var uindex in diagonal)
                if(uindex >= 0){
                    if(is_valid_mv(uindex, j, board)){
                        if(check(uindex, j, board, defend_unit_color)
                                === -1){
                            can_rescue = true;
                            break;
                        }
                    }
                }

            if(can_rescue) return false;
        }
    }

    // horizontal iteration
    for(j = up_index; j > lp_index; j--){
        for(uindex of horizontal){
            if(uindex >= 0){
                var def_unit = board[uindex]
                if(is_valid_mv(uindex, j, board)){
                    if(check(uindex, j, board,
                             defend_unit_color) === -1){
                        can_rescue = true;
                        break;
                    }
                }
            }
        }
        if(can_rescue) return false;
    }

    delta_arr = [8, -8, -16, 16]

    for(delta of delta_arr){
        unit = board[start_index + delta]
        if(unit.unit_type === "soldier"){
            if(unit.cl === "black"){
                b_vertical.push(Global.Global.black_unit_indices[unit.index])
            }
            else if(unit.cl === "white"){
                w_vertical.push(Global.Global.white_unit_indices[unit.index])
            }
        }
    }



    // vertical iteration
    for(j = up_index; j > lp_index; j -= 8){
        for(uindex of vertical){
            if(uindex >= 0){
                if(is_valid_mv(uindex, j, board)){
                    if(check(uindex, j, board,
                             defend_unit_color) === -1){
                        can_rescue = true;
                        break;
                    }
                }
            }
        }



        if(can_rescue) return false;
    }







    return true;
}

//! returns an empty unit to fill the cells with no chess piece
function empty_unit(){
    return new Unit("", "empty", -1)
}


//! checks if horse can jump to target or not
function is_valid_jump(start_index, target_index, board){
    var start_unit = board[start_index]
    var tar_unit = board[target_index]
    // conditions to check
    var cd1, cd2, cd3, cd4, cd5, cd6, cd7, cd8
    if(tar_unit.cl === start_unit.cl){
        return false;
    }
    var hdist = Math.abs(start_index % 8 - target_index % 8)
    var vdist = Math.abs(Math.floor(start_index / 8) -
                         Math.floor(target_index / 8))

    return (Math.min(hdist, vdist) === 1 &&
            Math.max(hdist, vdist) === 2)

}

// this function always starts from upper position on the board to the lower position and
// checks if they can meet together with a vertical move of starter
function is_valid_vertical(start_index, target_index, board){

    if(start_index % 8 !== target_index % 8){

        return false;
    }

    var start_unit = board[start_index]
    var tar_unit = board[target_index]
    var up_unit = board[Math.max(start_index, target_index)]
    var lp_unit = board[Math.min(start_index, target_index)]
    var up_index = Math.max(start_index, target_index)
    var lp_index = Math.min(start_index, target_index)
    var king = start_unit.unit_type === "king"
    var soldier = start_unit.unit_type === "soldier"
    var dist = Math.abs(start_index - target_index)

    if(king){
        if(dist !== 8) return false
    }

    if(soldier){
        var cl = start_unit.cl
        if(tar_unit.unit_type !== "empty"){
            return false;
        }
        var b_soldier_init_ind = start_index > 7 && start_index <= 15;
        var w_soldier_init_ind = start_index >= 48 && start_index < 56;
        var is_first_move = ((cl === "white") && w_soldier_init_ind)
                || ((cl === "black") && b_soldier_init_ind)

        if(is_first_move){
            if(dist > 16) return false
            if(dist === 16) return true
            if(dist === 8) return true
            return false
        }
        else{
            if(dist > 8) return false
            if(cl === "white"){
                if(target_index >= start_index) return false
                return true;
            }
            if(cl === "black"){
                if(target_index <= start_index) return false
                return true;
            }
        }
    }
    var found = false

    for(var i = Math.max(start_index, target_index) - 8;
        i >= Math.min(start_index, target_index); i -= 8){

        if(board[i].unit_type !== "empty" && board[i] !== lp_unit){

            return false;
        }

        if(i ===  Math.min(start_index, target_index)) found = true
    }

    if(!found) return false

    if(tar_unit.cl === start_unit.cl){
        return false;
    }


    return true;
}

//! this function always starts from upper position on the board to the lower position and
// checks if they can meet together with a horizontal move of starter
function is_valid_horizontal(start_index, target_index, board){

    var start_unit = board[start_index]
    var tar_unit = board[target_index]
    var up_unit= board[Math.max(start_index, target_index)]
    var lp_unit = board[Math.min(start_index, target_index)]
    var up_pos = Math.max(start_index, target_index)
    var lp_pos = Math.min(start_index, target_index)

    var up_row = Math.floor(up_pos / 8)
    var lp_row = Math.floor(lp_pos / 8)

    var king = start_unit.unit_type === "king"
    var dist = Math.abs(start_index - target_index)

    if(king){
        if(dist > 1) return false
    }

    if(up_row !== lp_row){

        return false
    }

    var found = false
    for(var i = up_pos - 1; i >= lp_pos; i--){

        if(board[i].unit_type !== "empty" && board[i] !== lp_unit){
            return false;
        }

        if(i === Math.min(start_index, target_index)) found = true
    }

    if(!found) return false
    if(tar_unit.cl === start_unit.cl){
        return false;
    }

    return true;
}

//! this function always starts from upper position on the board to the lower position and
// checks if they can meet together with a diagonal move of starter
function is_valid_diagonal(start_index, target_index, board){
    var start_unit = board[start_index]
    var tar_unit = board[target_index]
    var up_unit= board[Math.max(start_index, target_index)]
    var lp_unit = board[Math.min(start_index, target_index)]
    var up_pos = Math.max(start_index, target_index)
    var lp_pos = Math.min(start_index, target_index)
    var king = start_unit.unit_type === "king"
    var soldier = start_unit.unit_type === "soldier"

    if(king || soldier){
        var dist = Math.abs(start_index - target_index)
        if(dist !== 9 &&  dist !== 7) return false
    }


    if(soldier){
        if(tar_unit.unit_type === "empty"){
            return false
        }

        if(start_unit.cl === "white"){
            if(start_unit !== up_unit){
                return false
            }
        }
        else if(start_unit.cl === "black"){
            if(start_unit !== lp_unit){
                return false
            }
        }
    }
    var delta = 0;

    // \ north west
    if(Math.abs(up_pos - lp_pos) % 9 === 0){
        delta = 9
    }
    // / north east
    else if(Math.abs(up_pos - lp_pos) % 7 === 0){
        delta = 7;
    }
    else{
        return false
    }

    for(var i = up_pos - delta; i >= lp_pos; i -= delta){
        if(board[i].unit_type !== "empty" && board[i] !== lp_unit){

            return false;
        }
    }

    if(tar_unit.cl === start_unit.cl){

        return false;
    }

    return true;
}


// initializes the arguments with default chess position.
function create_table(board, black_unit_indices, white_unit_indices
                      , b_king_pos, w_king_pos){
    // each team has 16 pieces and an array(black_unit_indices or white_unit_indices)
    // is dedicated to it, index_by_team is an integer between 0 and 16 for
    // accessing the nth element of these arrays


    var index_by_team = 0


    for(var i = 0; i <= 63; i++){

        let new_unit = new Unit()
        var cell_index = i;

        if((cell_index > 7 && cell_index <= 15 )) {
            new_unit = new Unit("black", "soldier", i, index_by_team)
            board[i] = new_unit

            black_unit_indices[index_by_team] = i
            index_by_team++;
        }
        else if(cell_index >= 16 && cell_index < 48){
            index_by_team = 0
            new_unit = new Unit("", "empty", cell_index, -1)

            board[i] = new_unit
        }
        else if((cell_index >= 48 && cell_index < 56)) {
            new_unit = new Unit("white", "soldier", i, index_by_team)

            white_unit_indices[index_by_team] = i
            board[i] = new_unit
            index_by_team++;
        }
        else{
            switch(cell_index){
            case 56:
                new_unit = new Unit("white", "rock", i, index_by_team)

                white_unit_indices[index_by_team] = i
                board[i] = new_unit
                index_by_team++; break;
            case 57:
                new_unit = new Unit("white", "horse", i, index_by_team)

                white_unit_indices[index_by_team] = i
                board[i] = new_unit
                index_by_team++; break;
            case 58:
                new_unit = new Unit("white", "bishop", i, index_by_team)

                white_unit_indices[index_by_team] = i
                board[i] = new_unit
                index_by_team++; break;
            case 60:
                new_unit = new Unit("white", "king", i, index_by_team)
                w_king_pos = cell_index

                white_unit_indices[index_by_team] = i
                board[i] = new_unit
                index_by_team++; break;
            case 59:
                new_unit = new Unit("white", "queen", i, index_by_team)

                white_unit_indices[index_by_team] = i
                board[i] = new_unit
                index_by_team++; break;
            case 61:
                new_unit = new Unit("white", "bishop", i, index_by_team)
                board[i] = new_unit

                white_unit_indices[index_by_team] = i
                index_by_team++; break;
            case 62:
                new_unit = new Unit("white", "horse", i, index_by_team)

                white_unit_indices[index_by_team] = i
                board[i] = new_unit
                index_by_team++; break;
            case 63:
                new_unit = new Unit("white", "rock", i, index_by_team)

                white_unit_indices[index_by_team] = i
                board[i] = new_unit
                index_by_team++; break;


            case 0:
                new_unit = new Unit("black", "rock", i, index_by_team)

                black_unit_indices[index_by_team] = i
                board[i] = new_unit
                index_by_team++; break;
            case 1:
                new_unit = new Unit("black", "horse", i, index_by_team)

                black_unit_indices[index_by_team] = i
                board[i] = new_unit
                index_by_team++; break;
            case 2:
                new_unit = new Unit("black", "bishop", i, index_by_team)

                black_unit_indices[index_by_team] = i
                board[i] = new_unit
                index_by_team++; break;
            case 4:
                new_unit = new Unit("black", "king", i, index_by_team)
                b_king_pos = cell_index

                board[i] = new_unit
                black_unit_indices[index_by_team] = i
                index_by_team++; break;
            case 3:
                new_unit = new Unit("black", "queen", i, index_by_team)

                black_unit_indices[index_by_team] = i

                board[i] = new_unit

                index_by_team++; break;
            case 5:
                new_unit = new Unit("black", "bishop", i, index_by_team)

                board[i] = new_unit
                black_unit_indices[index_by_team] = i
                index_by_team++; break;
            case 6:
                new_unit = new Unit("black", "horse", i, index_by_team)

                board[i] = new_unit
                black_unit_indices[index_by_team] = i
                index_by_team++; break;
            case 7:
                new_unit = new Unit("black", "rock", i, index_by_team)

                board[i] = new_unit
                black_unit_indices[index_by_team] = i
                index_by_team++; break;

            }
        }
    }
}

//! checks if the player is check
// returns position of threatened king, if no one, returns -1
// It creates a virtual board, makes a movement on it and checks if
// in that scenario the king is threatened or not.


// It checks if a given index is within the range of board or not.
function is_index_out_of_range(index){
    if(index > 63 || index < 0 || index === undefined) return true;
    return false;
}

function check(start_index, target_index, board, color){

    if(is_index_out_of_range(start_index) ||
            is_index_out_of_range(target_index))
        return false;

    // deep copy from actual board
    var future_board = JSON.parse(JSON.stringify(board));
    var future_white_unit_indices = JSON.parse(
                JSON.stringify(Global.Global.white_unit_indices));
    var future_black_unit_indices =
            JSON.parse(JSON.stringify(Global.Global.black_unit_indices));


    var tmp_turn = Global.Global.player_turn

    var white_king_pos = Global.Global.w_king_pos
    var black_king_pos = Global.Global.b_king_pos

    if(start_index === Global.Global.w_king_pos){
        white_king_pos = target_index
    }
    if(start_index === Global.Global.b_king_pos){
        black_king_pos = target_index
    }

    if(color === "black"){
        if(future_board[start_index].cl === "white"){
            if(future_board[start_index].id !== -1)
                future_white_unit_indices[future_board[start_index].id]
                        =  target_index
            if(future_board[target_index].id !== -1 &&
                    future_board[target_index].cl === "black")
                future_black_unit_indices[future_board[target_index].id]
                        =  -1
        }
    }
    else if(color === "white"){
        if(future_board[start_index].cl === "black"){
            if(future_board[start_index].id !== -1)
                future_black_unit_indices[future_board[start_index].id] =
                        target_index
            if(future_board[target_index].id !== -1 &&
                    future_board[target_index].cl === "white")
                future_white_unit_indices[future_board[target_index].id] =
                        -1
        }
    }

    future_board[start_index].index = future_board[target_index].index
    future_board[target_index]  = future_board[start_index]
    future_board[start_index] =  empty_unit()

    var threatened = -1

    if(color === "white"){
        future_black_unit_indices.forEach(function(uindex) {
            if(is_valid_mv(uindex, white_king_pos, future_board)){
                threatened = Global.Global.w_king_pos

            }
        })
    }

    if(color === "black"){
        future_white_unit_indices.forEach(function(uindex) {
            if(is_valid_mv(uindex, black_king_pos, future_board)){
                threatened = Global.Global.b_king_pos
            }
        })
    }
    return threatened

}

//! start_index, target_index are positions in board
// It only checks if a move is possible for a chess piece
// without considering checkmate
function is_valid_mv(start_index, target_index, board){
    if(is_index_out_of_range(start_index) ||
            is_index_out_of_range(target_index))
        return false;
    var start_unit = board[start_index]
    var tar_unit = board[target_index]
    var cl = Global.Global.player_turn === 0 ? "white" : "black"
    var op_king = ""

    if(start_unit === undefined){
        return false
    }

    //! conditions to check different kind of movements
    var cd1, cd2, cd3, cd4
    switch(start_unit.unit_type){

    case "soldier":
        cd1 = is_valid_vertical(start_index, target_index, board)
        cd2 = is_valid_diagonal(start_index, target_index, board)
        return (cd1 || cd2)
    case "bishop":

        return is_valid_diagonal(start_index, target_index, board)

    case "rock":
        cd1 = is_valid_vertical(start_index, target_index, board)
        cd2 = is_valid_horizontal(start_index, target_index, board)
        return (cd1 || cd2)

    case "king":
        cd1 = is_valid_vertical(start_index, target_index, board)
        cd2 = is_valid_horizontal(start_index, target_index, board)
        cd3 = is_valid_diagonal(start_index, target_index, board)

        return cd1 || cd2 || cd3

    case "queen":
        cd1 = is_valid_vertical(start_index, target_index, board)
        cd2 = is_valid_horizontal(start_index, target_index, board)
        cd3 = is_valid_diagonal(start_index, target_index, board)

        return cd1 || cd2 || cd3

    case "horse":
        return is_valid_jump(start_index, target_index, board)
    }
}

// when the game is finished, it updates players statistics
// and writes to the corresponding file.
function update_statistics(winner, loser){

    if(winner === Global.Global.players[0]){
        Global.Global.players[0].win_cnt++;
        Global.Global.players[1].lose_cnt++;
    }
    else if(winner === Global.Global.players[1]){
        Global.Global.players[1].win_cnt++;
        Global.Global.players[0].lose_cnt++;
    }
    else{
        Global.Global.players[1].draw_cnt++;
        Global.Global.players[0].draw_cnt++;
    }

    var jsonObject = JSON.parse(JSON.stringify(Global.Global.game))
    console.log(JSON.stringify(jsonObject))

    gameutils.update_high_score(jsonObject)

}
